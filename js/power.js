// ─────────────────────────────────────────────────────────
//  THE POWER GRID  —  nests feed generators feed pylons
// ─────────────────────────────────────────────────────────
// A pylon's abilities are not free any more. Firing and the wave functions draw
// from a grid, the grid is fed by the nests you have taken, and a generator is
// what carries it from one to the other. Taking a zone is no longer only a line
// on the banner: it is the thing that lets you switch another turret on.
//
// The whole system is three questions, and each is answered in one function:
//
//   nestPowerOutput  — what one nest is worth
//   pylonPowerDraw   — what one pylon costs
//   recomputePower   — who gets it when there is not enough
//
// It is recomputed with the pylon cache rather than every frame; nothing in it
// changes faster than that, and the cache is already the place the rest of the
// pylon bookkeeping happens.

// ── SUPPLY ───────────────────────────────────────────────
// A nest only pays if it is on your side of the fight AND wired in:
//
//   - the HOME PORTAL always pays. It is zone 0's nest, it was never theirs,
//     and it needs no generator — it is the supply a new game starts with, and
//     without it the pylon the player is given could not run.
//   - any other nest pays only once it is NEUTRALISED (its zone taken, so it
//     has stopped spawning) and LINKED to a live generator. A nest still
//     pouring predators out of the wall is not yours to draw on.
//
// Deeper zones pay more. That is the pressure: the grid grows by going forward,
// not by building more at home.
function nestPowerOutput(t) {
    if (!t || !t.nest) return 0;
    if (typeof isHomePortal === "function" && isHomePortal(t)) return POWER_HOME_SUPPLY;
    if (t.nestHealth > 0) return 0;               // still theirs
    const gen = t.connectedPylon;
    if (!gen || !isGeneratorPylon(gen)) return 0; // taken, but not wired in
    const zone = Number.isFinite(t.nestZone) ? t.nestZone : 0;
    return POWER_PER_NEST * (1 + POWER_ZONE_BONUS * Math.max(0, zone));
}

// Everything the grid is making right now.
function powerSupply() {
    let total = 0;
    const nests = (typeof _nestCache !== "undefined" && _nestCache.length)
        ? _nestCache : world.filter(t => t.nest);
    for (const t of nests) total += nestPowerOutput(t);
    return total;
}

// ── DEMAND ───────────────────────────────────────────────
// Only the two abilities cost anything. A plain pylon is free, and so is a
// generator — a generator that charged for itself would make the first one you
// build a step backwards.
function pylonPowerDraw(t) {
    if (!t || !t.pillar || t.destroyed || !(t.health > 0)) return 0;
    if (t.pillarTeam !== "green") return 0;       // not yours to run
    if (t.isGenerator) return 0;
    if (t.waveMode)   return POWER_DRAW_WAVE;
    if (t.attackMode) return POWER_DRAW_ATTACK;
    return 0;
}

// Is this pylon close enough to a generator to be fed at all? The grid reaches
// exactly as far as a generator's link does, which is the same range the
// healing aura and the network links already use — one reach, not a new one.
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

// ── WHO GETS IT ──────────────────────────────────────────
// Called from the pylon cache rebuild, and it is what decides whether a pylon
// actually does its job this tick. Sets `powered` on every pylon, so everything
// downstream — the firing loop, the wave loop, the drawing — asks one flag
// rather than working the rule out again.
//
// Two ways to be dark:
//
//   NO GENERATOR — nothing is carrying power to it. A turret on the far side of
//                  the map is not on the grid however much the grid is making.
//   BROWNOUT     — it is on the grid, but the grid is oversubscribed.
//
// Shedding order is nearest-the-generator first KEEPS power, so the base around
// your generator stays lit and the outlying pylons are what go dark. Ties break
// on x then y so the same board always sheds the same pylons — a grid that
// flickered between two equally distant pylons would be unreadable.
function recomputePower() {
    _powerSupply = powerSupply();
    _powerDemand = 0;
    _powerShed   = [];
    if (typeof _pillarCache === "undefined") return;

    const asking = [];
    for (const t of _pillarCache) {
        const draw = pylonPowerDraw(t);
        if (draw <= 0) { t.powered = true; t.powerFed = null; continue; }
        _powerDemand += draw;
        const gen = generatorFeeding(t);
        t.powerFed = gen;
        if (!gen) { t.powered = false; _powerShed.push(t); continue; }
        asking.push({ t, draw, d2: (gen.x - t.x) ** 2 + (gen.y - t.y) ** 2 });
    }

    asking.sort((a, b) => (a.d2 - b.d2) || (a.t.x - b.t.x) || (a.t.y - b.t.y));
    let left = _powerSupply;
    for (const a of asking) {
        if (a.draw <= left) { left -= a.draw; a.t.powered = true; }
        else { a.t.powered = false; _powerShed.push(a.t); }
    }
}

// What the HUD says. Kept here so the readout and the rule cannot disagree
// about what "short" means.
function powerStatus() {
    return {
        supply: _powerSupply,
        demand: _powerDemand,
        spare: _powerSupply - _powerDemand,
        shed: _powerShed.length,
        short: _powerShed.length > 0,
    };
}
