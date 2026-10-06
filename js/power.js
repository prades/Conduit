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
        // A generator that has been switched off feeds nothing.
        if (gen.circuitOn === false) continue;
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
    if (!gen || !isGeneratorPylon(gen) || gen.circuitOn === false) return null;
    const linked = gen.nestConnection;
    if (linked && nestIsPowerSource(linked)) return linked;
    return nearestDrawableNest(gen);
}

// "The player can draw power from all the nests that have been neutralized."
// A relay with no nest linked to it still draws on the closest battery that is
// yours and in reach: the home reserve within HOME_POWER_REACH, or any nest you
// have neutralised within GENERATOR_NEST_RANGE — the same reach it was allowed
// to be built at. The link autoLinkRelays() makes is the same nest, so it wins.
function nearestDrawableNest(r) {
    if (!r) return null;
    const list = (typeof _nestCache !== "undefined" && _nestCache.length) ? _nestCache : world;
    let best = null, bestD = Infinity;
    for (const n of list) {
        if (!n.nest || !nestIsPowerSource(n)) continue;
        const d = Math.hypot(n.x - r.x, n.y - r.y);
        if (d > nestReachFor(n)) continue;
        if (d < bestD) { bestD = d; best = n; }
    }
    return best;
}

// ── NEST GRIDS & THE NEST SWITCH ─────────────────────────
// "Connect the power from one nest to the network of another nest, and turn the
// power from a conquered nest on and off, so you're not drawing it all before
// the predators approach."
//
// GRIDS. Two nests are one grid when a relay linked to one stands within reach
// of a relay linked to the other — a connector's CONNECTOR_RANGE, or a plain
// link (getPylonRange) between two generators. A relay switched off does not
// tie. Pylons still draw through their own relay's nest, but when that nest
// cannot pay (empty, or switched off) the grid pays from its fullest member.
// A gold cable on the floor shows each tie.
//
// THE SWITCH. Long-press a nest you hold → NEST OFF. Its battery is then not
// drawn on by anything — it keeps charging — until you turn it back on.
let _gridLinks = [];      // [{ a, b }] relay pairs that tie two nests' grids
function nestOnline(n) { return nestIsPowerSource(n) && !n.powerOff; }
function buildNestGrids() {
    _gridLinks = [];
    const nests = (typeof _nestCache !== "undefined" && _nestCache.length) ? _nestCache : world.filter(t => t.nest);
    const parent = new Map();
    for (const n of nests) { n._grid = null; parent.set(n, n); }
    const find = n => { while (parent.get(n) !== n) n = parent.get(n); return n; };
    if (typeof _pillarCache === "undefined") return;
    const relays = _pillarCache.filter(r => isRelayPylon(r) && r.pillarTeam === "green" && !r.destroyed && r.health > 0 &&
                                            r.circuitOn !== false && r.nestConnection && nestIsPowerSource(r.nestConnection));
    const tied = new Set();
    for (let i = 0; i < relays.length; i++) {
        for (let j = i + 1; j < relays.length; j++) {
            const a = relays[i], b = relays[j], na = a.nestConnection, nb = b.nestConnection;
            if (na === nb || !parent.has(na) || !parent.has(nb)) continue;
            const reach = (a.isConnector || b.isConnector) ? CONNECTOR_RANGE : getPylonRange();
            if (Math.hypot(a.x - b.x, a.y - b.y) > reach) continue;
            const ra = find(na), rb = find(nb);
            if (ra !== rb) parent.set(ra, rb);
            const key = [na.x, na.y, nb.x, nb.y].join(",");
            if (!tied.has(key)) { tied.add(key); _gridLinks.push({ a, b }); }
        }
    }
    for (const n of nests) n._grid = find(n);
}
// Every ONLINE nest in this nest's grid, the nest itself first and then the
// fullest, which is the order they pay in.
function gridMembers(src) {
    if (!src) return [];
    const root = src._grid || src;
    const list = (typeof _nestCache !== "undefined" && _nestCache.length) ? _nestCache : world.filter(t => t.nest);
    const out = list.filter(n => n !== src && (n._grid || n) === root && nestOnline(n))
                    .sort((x, y) => nestEnergy(y) - nestEnergy(x));
    return nestOnline(src) ? [src, ...out] : out;
}
// Could the grid behind `src` pay `price` in one go?
function gridCan(src, price) {
    return gridMembers(src).some(n => nestEnergy(n) >= price + POWER_MIN_RESERVE);
}
// Pay `amount` from the grid behind `src`; returns the nest that paid, or null.
function gridPay(src, amount) {
    for (const n of gridMembers(src)) if (spendNestEnergy(n, amount)) return n;
    return null;
}
// The best fill (0..1) of any online nest in the grid — for the wave restart.
function gridBestFill(src) {
    let best = 0;
    for (const n of gridMembers(src)) best = Math.max(best, nestEnergy(n) / Math.max(1, nestEnergyMax(n)));
    return best;
}
function toggleNestPower(n) {
    if (!n || !nestIsPowerSource(n)) return false;
    n.powerOff = !n.powerOff;
    recomputePower();
    if (typeof _cacheAge !== "undefined") _cacheAge = -9999;
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
        text: n.powerOff ? "NEST OFF \u2014 ITS POWER IS HELD IN RESERVE" : "NEST ON \u2014 POWER AVAILABLE",
        color: n.powerOff ? "#ffb347" : NEST_COLOUR_CONTROLLED, life: 120, vy: -0.25, size: 12 });
    return true;
}

// ── AUTOMATIC LINKS ──────────────────────────────────────
// "Get rid of the connect-to-nest option and just automatically connect whenever
// there is a connector or a pylon near it." Every generator and connector you
// own is linked to the closest nest it can draw on — a zone you have
// neutralised within GENERATOR_NEST_RANGE, or the home portal within
// HOME_POWER_REACH. A link that has gone bad (the nest is no longer yours) is
// dropped and a new one found. The nest shows CONTROLLED and
// the blue cable runs to it, exactly as a hand-made link used to.
function nestReachFor(n) {
    return (typeof isHomePortal === "function" && isHomePortal(n)) ? HOME_POWER_REACH : GENERATOR_NEST_RANGE;
}
function autoLinkRelays() {
    if (typeof _pillarCache === "undefined") return;
    for (const r of _pillarCache) {
        if (!isRelayPylon(r) || r.pillarTeam !== "green" || r.destroyed || !(r.health > 0)) continue;
        const cur = r.nestConnection;
        // A link is only ever MADE in reach (and relays do not move), so the
        // one thing that can spoil it is the nest stopping being yours.
        const good = cur && nestIsPowerSource(cur);
        if (good) {
            if (!cur.connectedPylon || cur.connectedPylon.destroyed || !cur.connectedPylon.pillar) cur.connectedPylon = r;
            continue;
        }
        if (cur && cur.connectedPylon === r) cur.connectedPylon = null;
        const n = nearestDrawableNest(r);
        r.nestConnection = n || null;
        if (!n) continue;
        if (!n.connectedPylon || n.connectedPylon.destroyed || !n.connectedPylon.pillar) n.connectedPylon = r;
        floatingTexts.push({ x: r.x, y: r.y - 1, text: "LINKED TO NEST", color: NEST_COLOUR_CONTROLLED, life: 90, vy: -0.08 });
    }
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

// Turn a relay on or off: a connector's circuit, or a generator's output. Either
// way every pylon it was feeding loses power until it is switched back.
function toggleRelayCircuit(r) {
    if (!isSwitchableRelay(r)) return false;
    r.circuitOn = r.circuitOn === false;   // false → true, anything else → false
    recomputePower();
    // The wave and attack lists are rebuilt on the 60-frame cache; a switch
    // should land now, not a second later.
    if (typeof _cacheAge !== "undefined") _cacheAge = -9999;
    if (typeof tutorialNoteCircuit === "function") tutorialNoteCircuit(r);
    const gen = isGeneratorPylon(r);
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
        text: r.circuitOn ? (gen ? "GENERATOR ON \u2014 POWER FLOWING" : "CIRCUIT CLOSED \u2014 POWER FLOWING")
                          : (gen ? "GENERATOR OFF \u2014 PYLONS DARK" : "CIRCUIT OPEN \u2014 GROUP DARK"),
        color: r.circuitOn ? (gen ? "#8fd6ff" : CONNECTOR_COLOR) : "#f88", life: 110, vy: -0.25, size: 12 });
    return true;
}
// The connector's name for it, kept for the callers that grew up with it.
function toggleConnectorCircuit(c) { return isConnectorPylon(c) ? toggleRelayCircuit(c) : false; }

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
    autoLinkRelays();
    buildNestGrids();
    const drawing = [];
    for (const t of _pillarCache) {
        if (!needsPower(t)) { t.powered = true; t.powerSource = null; t.powerGen = null; continue; }
        // BOTH ends of the chain are remembered, not just the nest. The wiring
        // is drawn along pylon → generator → nest, and working the middle out
        // again at draw time would be a second copy of the routing rule.
        const route = powerRoute(t);
        t.powerGen    = route.feeder;
        t.powerSource = route.source;
        drawing.push(t);
    }
    // POWER RUNS DOWN THE CHAIN. REPORTED: a row of electric pylons never
    // reached tier III — only the one or two within a generator's reach were
    // ever lit, because pylons did not pass power on. Now a pylon with no relay
    // of its own takes power from a lit pylon within link range, and that one
    // can pass it on again, so a network fed at one end is fed all along.
    // powerGen is then the neighbour it is wired to.
    propagatePower(drawing);
    for (const t of drawing) {
        // A wave pylon that ran its pool dry is TRIPPED: it stays off until the
        // pool has refilled to POWER_RESTART_LEVEL, not just above zero.
        if (t.waveTripped && t.powerSource && gridBestFill(t.powerSource) >= POWER_RESTART_LEVEL) {
            t.waveTripped = false;
            floatingTexts.push({ x: t.x, y: t.y - 1, text: "WAVE BACK ONLINE", color: "#8fd6ff", life: 70, vy: -0.06 });
        }
        if (!t.waveMode) t.waveTripped = false;
        // Lit means the pool can pay for what this pylon DOES, not merely that it
        // holds something: with 0 < energy < the price of a shot a turret used to
        // look powered and sit silent.
        t.powered = !!t.powerSource && !t.waveTripped && gridCan(t.powerSource, powerPriceOf(t));
    }
    // The pools worth showing: every one something is drawing on, plus home.
    const seen = new Set();
    for (const t of _pillarCache) {
        if (t.powerSource && !seen.has(t.powerSource)) { seen.add(t.powerSource); _powerPools.push(t.powerSource); }
    }
}

// Breadth-first from every pylon a relay feeds, outward through link range.
function propagatePower(list) {
    const r2 = Math.pow(getPylonRange(), 2);
    const queue = list.filter(t => t.powerSource);
    const dark = new Set(list.filter(t => !t.powerSource));
    for (let i = 0; i < queue.length && dark.size; i++) {
        const fed = queue[i];
        for (const t of dark) {
            const dx = t.x - fed.x, dy = t.y - fed.y;
            if (dx * dx + dy * dy > r2) continue;
            t.powerSource = fed.powerSource; t.powerGen = fed;
            dark.delete(t); queue.push(t);
        }
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
    const paid = gridPay(src, POWER_SHOT_COST);
    if (!paid) return false;
    // A SURGE down the wire. A turret's draw is a spike, not a trickle, and the
    // wiring is the only place the player can see which pylons are costing
    // them — so the round that was just paid for lights its own line.
    t.powerFlow = 1;
    paid.powerFlow = 1;
    return true;
}

// How hard this pylon is pulling right now, 0..1, for the wiring to draw.
// Wave mode is pinned at full while it is on, because its draw never stops; a
// turret spikes on each round and fades, so an idle turret's line goes quiet
// and the player can see it costing nothing.
function powerFlowOf(t) {
    if (!t || !t.powered) return 0;
    if (t.waveMode) return t.waveAwake === false ? 0 : 1;   // on standby it draws nothing
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
        // On standby it draws nothing: it only pays while it is working.
        if (t.waveAwake === false) continue;
        const src = t.powerSource || pylonSource(t);
        if (!src) { t.powered = false; continue; }
        if (!groups.has(src)) groups.set(src, []);
        groups.get(src).push(t);
    }
    for (const [src, list] of groups) {
        const cost = POWER_WAVE_DRAIN * (1 + (list.length - 1) * POWER_WAVE_SHARE);
        if (gridPay(src, cost)) continue;
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
        if (t.circuitOn === false) return { text: "SWITCHED OFF \u2014 PYLONS DARK", colour: "#f88" };
        const src = generatorSource(t);
        return src ? { text: "FEEDING \u00b7 NEST " + pct(src), colour: "#8fd6ff" }
                   : { text: "NO NEST IN REACH \u2014 LINK ONE", colour: "#f88" };
    }
    if (!(t.waveMode || t.attackMode)) return { text: "NONE NEEDED (DORMANT)", colour: "#888" };
    if (t.waveTripped) return { text: "SHUT OFF \u2014 WAITING FOR THE NEST TO REFILL", colour: "#ff7755" };
    // What recomputePower settled on, so a pylon lit down the chain reads as
    // powered rather than as having no generator of its own.
    const route = t.powerSource ? { feeder: t.powerGen, source: t.powerSource } : powerRoute(t);
    // A generator in reach that has been turned off is the likeliest reason.
    if (!route.source && _genPylons.some(g => g.circuitOn === false && g !== t &&
            Math.hypot(g.x - t.x, g.y - t.y) <= getPylonRange()))
        return { text: "GENERATOR IS OFF \u2014 TURN IT BACK ON", colour: "#f88" };
    if (!route.feeder && !route.source) return { text: "NO GENERATOR OR CONNECTOR IN REACH", colour: "#f88" };
    if (!route.source) return { text: "FEEDER HAS NO NEST \u2014 LINK ONE", colour: "#f88" };
    if (!gridCan(route.source, powerPriceOf(t))) return { text: route.source.powerOff && gridMembers(route.source).length === 0 ? "NEST SWITCHED OFF" : "NEST EMPTY", colour: "#ff7755" };
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
