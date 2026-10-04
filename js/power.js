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
    return nearestDrawableNest(gen);
}

// "The player can draw power from all the nests that have been neutralized."
// A relay with no nest linked to it still draws on the closest battery that is
// yours and in reach: the home reserve within HOME_POWER_REACH, or any nest you
// have neutralised within GENERATOR_NEST_RANGE — the same reach it was allowed
// to be built at. CONNECT is still the way to pick WHICH nest, and it wins.
function nearestDrawableNest(r) {
    if (!r) return null;
    const list = (typeof _nestCache !== "undefined" && _nestCache.length) ? _nestCache : world;
    let best = null, bestD = Infinity;
    for (const n of list) {
        if (!n.nest || !nestIsPowerSource(n)) continue;
        const home = typeof isHomePortal === "function" && isHomePortal(n);
        const d = Math.hypot(n.x - r.x, n.y - r.y);
        if (d > (home ? HOME_POWER_REACH : GENERATOR_NEST_RANGE)) continue;
        if (d < bestD) { bestD = d; best = n; }
    }
    return best;
}

// Can this nest be CONNECTED to a generator? A taken nest, or the home portal —
// anything that is a power source — as long as it is not already wired to a
// live generator. The home portal is never "taken", so asking whether its health
// had run out is what kept CONNECT off it.
function nestCanConnect(n) {
    if (!n || !nestIsPowerSource(n)) return false;
    return !(n.connectedPylon && !n.connectedPylon.destroyed);
}

// ── THE CONNECTOR ────────────────────────────────────────
// A connector is a relay with a switch. Closed (the default), it feeds every
// pylon within CONNECTOR_RANGE out of the nest it is linked to; open, it feeds
// none, and everything that was hanging off it goes dark at once.
function connectorLive(c) {
    return isConnectorPylon(c) && c.pillarTeam === "green" && c.circuitOn !== false;
}

// What a connector draws out of: its linked nest, or home's reserve if it
// stands near home — the same rule as a generator, so a connector built beside
// the Crystal works before anything has been taken.
function connectorSource(c) {
    if (!isConnectorPylon(c)) return null;
    const linked = c.nestConnection;
    if (linked && nestIsPowerSource(linked)) return linked;
    return nearestDrawableNest(c);
}

// The nearest closed connector that has something to give, or null.
function connectorFeeding(t) {
    if (!t || typeof _conPylons === "undefined") return null;
    let best = null, bestD = CONNECTOR_RANGE * CONNECTOR_RANGE;
    for (const c of _conPylons) {
        if (c === t || !connectorLive(c) || !connectorSource(c)) continue;
        const dx = c.x - t.x, dy = c.y - t.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= bestD) { bestD = d2; best = c; }
    }
    return best;
}

// Where a feeder (generator OR connector) draws from — for the wiring.
function relaySource(r) {
    return isConnectorPylon(r) ? connectorSource(r) : generatorSource(r);
}

function toggleConnectorCircuit(c) {
    if (!isConnectorPylon(c)) return false;
    c.circuitOn = c.circuitOn === false;   // false → true, anything else → false
    recomputePower();
    // The wave and attack lists are rebuilt on the 60-frame cache; a circuit
    // change should land now, not a second later.
    if (typeof _cacheAge !== "undefined") _cacheAge = -9999;
    if (typeof tutorialNoteCircuit === "function") tutorialNoteCircuit(c);
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
        text: c.circuitOn ? "CIRCUIT CLOSED — POWER FLOWING" : "CIRCUIT OPEN — GROUP DARK",
        color: c.circuitOn ? CONNECTOR_COLOR : "#f88", life: 110, vy: -0.25, size: 12 });
    return true;
}

// The feeder this pylon draws along and the pool behind it. A generator beside
// it comes first; if that has nothing to give, a connector in reach is next.
function powerRoute(t) {
    const gen = generatorFeeding(t);
    const gs = gen ? generatorSource(gen) : null;
    if (gs) return { feeder: gen, source: gs };
    const con = connectorFeeding(t);
    if (con) return { feeder: con, source: connectorSource(con) };
    return { feeder: gen, source: null };
}

// The pool this pylon spends out of, or null if nothing reaches it.
function pylonSource(t) {
    return powerRoute(t).source;
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
        const route = powerRoute(t);
        const gen = route.feeder;
        t.powerGen    = gen;
        t.powerSource = route.source;
        // A wave pylon that ran its pool dry is TRIPPED: it stays off until the
        // pool has refilled to POWER_RESTART_LEVEL, not just above zero.
        if (t.waveTripped && t.powerSource &&
            nestEnergy(t.powerSource) >= nestEnergyMax(t.powerSource) * POWER_RESTART_LEVEL) {
            t.waveTripped = false;
            floatingTexts.push({ x: t.x, y: t.y - 1, text: "WAVE BACK ONLINE", color: "#8fd6ff", life: 70, vy: -0.06 });
        }
        if (!t.waveMode) t.waveTripped = false;
        // Lit means the pool can pay for what this pylon DOES, not merely that it
        // holds something: with 0 < energy < the price of a shot a turret used to
        // look powered and sit silent.
        t.powered = !!t.powerSource && !t.waveTripped &&
                    nestEnergy(t.powerSource) >= powerPriceOf(t) + POWER_MIN_RESERVE;
    }
    // The pools worth showing: every one something is drawing on, plus home.
    const seen = new Set();
    for (const t of _pillarCache) {
        if (t.powerSource && !seen.has(t.powerSource)) { seen.add(t.powerSource); _powerPools.push(t.powerSource); }
    }
}

// What one use costs this pylon: a shot for a turret, a frame of draw for a
// wave pylon.
function powerPriceOf(t) {
    return (t && t.waveMode) ? POWER_WAVE_DRAIN : POWER_SHOT_COST;
}

// Does this pylon spend anything at all? A plain pylon still stands, still
// holds territory, still takes a healing aura, and costs nothing. A generator
// is the thing carrying the power, not a thing spending it.
function needsPower(t) {
    if (!t || !t.pillar || t.destroyed || !(t.health > 0)) return false;
    if (t.pillarTeam !== "green") return false;
    if (isRelayPylon(t)) return false;
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
        if (t.waveMode && t.powered && !isRelayPylon(t) && t.pillarTeam === "green") {
            t.powerFlow = 1;
            if (t.powerSource) t.powerSource.powerFlow = 1;
        }
    }
    const nests = (typeof _nestCache !== "undefined") ? _nestCache : [];
    for (const n of nests) {
        if (n.powerFlow > 0) n.powerFlow = Math.max(0, n.powerFlow - POWER_FLOW_FADE);
    }
}

// Wave mode's constant draw, once a frame per POOL (not per pylon).
//
// Every wave pylon drawing on the same nest is one network. The first costs the
// full POWER_WAVE_DRAIN and each extra adds POWER_WAVE_SHARE of it — see config.
// When the pool cannot pay, the network sheds ONE pylon, and then waits
// POWER_SHED_FRAMES before it will shed another; in between, what is left runs
// on what the pool still has. So a dying grid steps down through its tiers
// instead of every pylon tripping on the same frame. Switching a pylon back to
// attack mode, losing its generator, or being tripped are the other ways off.
function waveDrainTick() {
    if (typeof _pillarCache === "undefined") return;
    const groups = new Map();
    for (const t of _pillarCache) {
        if (!t.waveMode || isRelayPylon(t) || t.pillarTeam !== "green") continue;
        if (t.waveTripped) { t.powered = false; continue; }
        const src = t.powerSource || pylonSource(t);
        if (!src) { t.powered = false; continue; }
        if (!groups.has(src)) groups.set(src, []);
        groups.get(src).push(t);
    }
    for (const [src, list] of groups) {
        const cost = POWER_WAVE_DRAIN * (1 + (list.length - 1) * POWER_WAVE_SHARE);
        if (spendNestEnergy(src, cost)) continue;
        // Cannot pay. Shed one, then give the rest time before shedding more.
        if (typeof frame !== "undefined" && src._shedAt !== undefined && frame - src._shedAt < POWER_SHED_FRAMES) continue;
        const victim = list[list.length - 1];
        victim.waveTripped = true;
        victim.powered = false;
        src._shedAt = (typeof frame !== "undefined") ? frame : 0;
        floatingTexts.push({ x: victim.x, y: victim.y - 1, text: "WAVE OFFLINE \u2014 OUT OF POWER", color: "#ff7755", life: 110, vy: -0.08 });
        // Out of the zone lists at once, not at the next 60-frame rebuild.
        if (typeof _cacheAge !== "undefined") _cacheAge = -9999;
    }
}

// ── WHY IS IT DARK ───────────────────────────────────────
// One plain sentence for a pylon's power state, for the INFO panel and the
// out-of-power messages, so the reason is a lookup rather than a guess.
function pylonPowerState(t) {
    const pct = n => n ? Math.round(100 * nestEnergy(n) / Math.max(1, nestEnergyMax(n))) + "%" : "";
    if (!t || !t.pillar) return { text: "\u2014", colour: "#888" };
    if (t.pillarTeam !== "green") return { text: "NOT YOURS \u2014 NO POWER", colour: "#f66" };
    if (isConnectorPylon(t)) {
        if (t.circuitOn === false) return { text: "CIRCUIT OPEN \u2014 FEEDING NOTHING", colour: "#f88" };
        const src = connectorSource(t);
        return src ? { text: "CIRCUIT CLOSED \u00b7 NEST " + pct(src), colour: "#ffd24a" }
                   : { text: "NO NEST IN REACH \u2014 LINK ONE", colour: "#f88" };
    }
    if (isGeneratorPylon(t)) {
        const src = generatorSource(t);
        return src ? { text: "FEEDING \u00b7 NEST " + pct(src), colour: "#8fd6ff" }
                   : { text: "NO NEST IN REACH \u2014 LINK ONE", colour: "#f88" };
    }
    if (!(t.waveMode || t.attackMode)) return { text: "NONE NEEDED (DORMANT)", colour: "#888" };
    if (t.waveTripped) return { text: "SHUT OFF \u2014 WAITING FOR THE NEST TO REFILL", colour: "#ff7755" };
    const route = powerRoute(t);
    if (!route.feeder && !route.source) return { text: "NO GENERATOR OR CONNECTOR IN REACH", colour: "#f88" };
    if (!route.source) return { text: "FEEDER HAS NO NEST \u2014 LINK ONE", colour: "#f88" };
    if (!(nestEnergy(route.source) >= powerPriceOf(t) + POWER_MIN_RESERVE)) return { text: "NEST EMPTY", colour: "#ff7755" };
    return { text: "POWERED \u00b7 NEST " + pct(route.source), colour: "#8fd6ff" };
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
