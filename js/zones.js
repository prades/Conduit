// ─────────────────────────────────────────────────────────
//  THE ZONE REPORT — every zone's status, network and equipment; teleport there; pay to clear what is broken
// ─────────────────────────────────────────────────────────
// REPORTED: "I want analytics to be in another tab at the bottom and it shows the status of each zone: if it's been cleared, what the network is and what
// equipment is there. The player may choose to teleport to the different zones and may clear the broken equipment for an estimated fee."
//
// zoneReport() reads the world and answers for each zone: its STATUS (home, cleared, under attack, the next target, unexplored), whether you HOLD a nest
// there, the NETWORK (the battery banks standing in it: element and tier), the POWER (a generator, the nests' charge), and the EQUIPMENT (turrets, wave
// pylons, batteries, relays, Ultras, modules), with how much of it is BROKEN. The Command Center's ANALYTICS tab draws it (js/commandcenter.js).
//
// TELEPORT takes you, and the squad following you, to a nest you hold in that zone (commands.js teleportToNest; the ring's TELEPORT is the same move).
// CLEAR BROKEN pays the fee to REMOVE the zone's broken equipment (wrecks and offline frames): the wreckage is gone and the tile is free to build on. It
// does not repair anything (the repair crew does that: ants rebuild a wreck, a core worker re-arms a frame; so does a builder you summon); it clears the
// way. The fee is shown before it is paid, and there is no refund.
const ZONE_FEE_WRECK = 5;     // shards to clear a wrecked pylon away (half a new pylon: PYLON_BUILD_COST is 10)
const ZONE_FEE_FRAME = 3;     // shards to clear an offline frame away
const ZONE_REPORT_MAX = 12;   // the most zones listed

const ZONE_STATUS = {
    home:     { label: "HOME",         col: "#19e6c1" },
    cleared:  { label: "CLEARED",      col: "#5fe0a0" },
    attack:   { label: "UNDER ATTACK", col: "#ff4a1c" },
    next:     { label: "NEXT TARGET",  col: "#ffe733" },
    unknown:  { label: "UNEXPLORED",   col: "#6a7aa0" },
};

function _zoneOf(t) { return getZoneIndex(t.x); }
// A nest you hold in the zone (the home portal for zone 0): where a teleport lands.
function zoneTeleportNest(z) {
    if (typeof world === "undefined") return null;
    const held = world.filter(t => t.nest && nestIsPowerSource(t) && (z === 0 ? isHomePortal(t) : (!isHomePortal(t) && _zoneOf(t) === z)));
    return held.length ? held.reduce((a, b) => (b.x > a.x ? b : a)) : null;
}
// The zone's broken equipment: wrecks (a pylon that fell) and offline frames (standing, waiting for a core worker).
function zoneBroken(z) {
    const wrecks = [], frames = [];
    for (const t of world) {
        if (!t.pillar || t.pillarTeam !== "green" || _zoneOf(t) !== z) continue;
        if (typeof isBrokenPylon === "function" && isBrokenPylon(t)) wrecks.push(t);
        else if (typeof isOfflinePylon === "function" && isOfflinePylon(t)) frames.push(t);
    }
    return { wrecks, frames };
}
function zoneClearFee(z) { const b = zoneBroken(z); return b.wrecks.length * ZONE_FEE_WRECK + b.frames.length * ZONE_FEE_FRAME; }

function _zoneCount() { return Math.max(1, Math.min(ZONE_REPORT_MAX, Math.max((gameState.highestZoneCleared || 0) + 1, (typeof activeDayZones !== "undefined" ? activeDayZones : 3) - 1) + 1)); }

// One zone's report.
function zoneInfo(z, pw) {
    const cleared = gameState.highestZoneCleared || 0;
    const underAttack = typeof alertActive !== "undefined" && alertActive && gameState.phase !== "waveComplete" && (typeof alertZone !== "undefined" && alertZone === z);
    const status = z === 0 ? "home" : underAttack ? "attack" : z <= cleared ? "cleared" : z === cleared + 1 ? "next" : "unknown";
    const nest = zoneTeleportNest(z);
    // NETWORK: the battery banks standing in this zone, by element, strongest first
    const net = {};
    for (const b of (typeof _batteryBanks !== "undefined" ? _batteryBanks : [])) {
        if (!b.members.length || getZoneIndex(b.members[0].x) !== z) continue;
        const e = net[b.el] || (net[b.el] = { el: b.el, tier: 0, batteries: 0 });
        e.tier = Math.max(e.tier, b.tier); e.batteries += b.members.length;
    }
    const network = Object.values(net).sort((a, b) => b.tier - a.tier);
    // EQUIPMENT: yours, by kind
    const eq = { turrets: 0, wave: 0, batteries: 0, generators: 0, connectors: 0, ultras: 0, other: 0 };
    for (const t of world) {
        if (!t.pillar || t.pillarTeam !== "green" || _zoneOf(t) !== z || t.destroyed) continue;
        if (t.isGenerator) eq.generators++; else if (t.isConnector) eq.connectors++; else if (t.isBattery) eq.batteries++;
        else if (t.attackMode) eq.turrets++; else if (t.waveMode) eq.wave++; else eq.other++;
        if (t._ultra && t._ultra.front === t) eq.ultras++;
    }
    const mods = {};
    for (const m of (typeof modules !== "undefined" ? modules : [])) if (getZoneIndex(m.x) === z) { const d = MODULE_DEFS[m.kind]; const k = d ? d.label : m.kind; mods[k] = (mods[k] || 0) + 1; }
    const br = zoneBroken(z);
    const pool = pw && pw.pools ? pw.pools.filter(p => p.zone === z) : [];
    return {
        z, name: z === 0 ? "HOME" : "ZONE " + z, status, statusLabel: ZONE_STATUS[status].label, statusColour: ZONE_STATUS[status].col,
        held: !!nest, nest, network, generator: typeof zoneHasGenerator === "function" ? zoneHasGenerator(z) : false,
        energy: pool.reduce((a, p) => a + p.energy, 0), energyMax: pool.reduce((a, p) => a + p.max, 0),
        equipment: eq, modules: mods, total: eq.turrets + eq.wave + eq.batteries + eq.generators + eq.connectors + eq.other,
        broken: br.wrecks.length, offline: br.frames.length, fee: br.wrecks.length * ZONE_FEE_WRECK + br.frames.length * ZONE_FEE_FRAME,
        here: typeof player !== "undefined" && getZoneIndex(Math.floor(player.x)) === z,
        crew: zoneCrewSummary(z), orders: (zoneOrders[z] || []).map(o => ({ label: zoneOrderLabel(o), status: o.status || "QUEUED", cost: zoneOrderCost(o) })),
    };
}
// Who is free to be sent (for the SEND CREW button's sub-line).
function zoneFreeCrew() { const c = zoneCrewCandidates(); return { ants: c.filter(_isAntBuilder).length, core: c.filter(_isCoreWorker).length, total: c.length }; }
function zoneReport() {
    const pw = typeof powerStatus === "function" ? powerStatus() : null, out = [], n = _zoneCount();
    for (let z = 0; z < n; z++) out.push(zoneInfo(z, pw));
    return out;
}

// ── THE ACTIONS ──
// TELEPORT: you and the squad following you, to a nest you hold in the zone. Says why when it cannot.
function zoneTeleport(z) {
    const nest = zoneTeleportNest(z), say = (text, color) => floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color, life: 100, vy: -0.2, size: 12 });
    if (!nest) { say(z === 0 ? "NO HOME PORTAL" : "NO NEST HELD IN ZONE " + z, "#f88"); return false; }
    if (getZoneIndex(Math.floor(player.x)) === z && Math.abs(player.x - teleportSpot(nest).x) < 2) { say("YOU ARE ALREADY THERE", "#8aa0c8"); return false; }
    return teleportToNest(nest);
}
// Take a pylon off the board entirely (the demolish's reset, without its refund and its banner): no wreck, the tile free, remembered so a reload does not regrow it.
function clearPylon(t) {
    for (const a of actors) if (a.job && a.job.target === t) a.job = null;
    for (const o of world) if (o.connectedPylon === t) o.connectedPylon = null;
    if (t.nestConnection) { t.nestConnection.connectedPylon = null; t.nestConnection = null; }
    Object.assign(t, { pillar: false, destroyed: false, pillarTeam: null, health: 0,
        attackMode: false, waveMode: false, attackModeElement: null, attackModeColor: null,
        isGenerator: false, isConnector: false, isBattery: false, circuitOn: undefined, upgraded: false, mk: 0, seasoned: 0,
        pendingUpgrade: false, upgradeFollower: null, chosenElement: null, chosenColor: null, chosenKind: null,
        reconstructing: false, reconstructProgress: 0, waveTripped: false, powered: undefined,
        powerSource: null, powerGen: null, waveAwake: undefined, _awakeUntil: undefined,
        offline: false, _offline: null, rearmProgress: 0, pendingDestroy: false, demolished: true });
}
// CLEAR BROKEN: pay the fee, and every wreck and offline frame in the zone is cleared away. Returns how many.
function zoneClearBroken(z) {
    const say = (text, color) => floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color, life: 110, vy: -0.2, size: 12 });
    const br = zoneBroken(z), fee = br.wrecks.length * ZONE_FEE_WRECK + br.frames.length * ZONE_FEE_FRAME, name = z === 0 ? "HOME" : "ZONE " + z;
    if (!br.wrecks.length && !br.frames.length) { say("NOTHING BROKEN IN " + name, "#8aa0c8"); return 0; }
    if (shardCount < fee) { say("NEED " + fee + " SHARDS TO CLEAR " + name, "#f44"); return 0; }
    shardCount -= fee; if (typeof saveShards === "function") saveShards();
    const all = br.wrecks.concat(br.frames);
    for (const t of all) { if (typeof elementEffects !== "undefined") for (let i = 0; i < 5; i++) elementEffects.push({ type: "impact", x: t.x + (Math.random() - 0.5) * 0.6, y: t.y + (Math.random() - 0.5) * 0.6, color: "#8aa0c8", radius: 0.4, life: 22 }); clearPylon(t); }
    if (typeof _cacheAge !== "undefined") _cacheAge = -9999;
    if (typeof savePylons === "function") { try { savePylons(); } catch (e) {} }
    say(name + ": " + all.length + " BROKEN CLEARED \u2014 " + fee + " \u25c6", "#19e6c1");
    return all.length;
}

// ─────────────────────────────────────────────────────────
//  REPAIR CREWS AND QUEUED BUILD ORDERS
// ─────────────────────────────────────────────────────────
// REPORTED: "I also want to be able to summon workers and builders to the area to fix stuff." Asked and answered: SEND CREW (free, real workers), queued
// build orders, and crews go into a zone even under attack (at their own risk).
//
// SEND CREW: every free ANT clone (the builders: they rebuild wrecks, repair, and put up orders) and CORE follower (the re-armers) is teleported to a nest you
// hold in that zone, put on work duty and told to hold a post there. Their own jobs (clonework.js, mass.js) then find what is broken within their reach
// and fix it: ants stand a wreck up as an offline frame, core workers re-arm it. RECALL brings them back to you and off the crew.
//
// BUILD ORDERS: a zone's queue of things to build (a generator, a battery or pod of batteries, a turret). The ANT builders in the zone work through it one at a
// time: the tile is picked where the build rules allow it (near the zone's power), it takes ORDER_BUILD_FRAMES of builder-work (more ants, faster), the shards
// are paid when it goes up (the order waits while you are short), and it is built exactly as the build window would. They need no one to stand there.
const ORDER_BUILD_FRAMES = 180;   // one builder's work for one order (a crew of three does it in a third of the time)
const ORDER_MAX = 8;              // queued per zone
const ORDER_KINDS = {
    generator: { label: "GENERATOR", tab: "power" },
    battery:   { label: "BATTERY",   tab: "power" },
    attack:    { label: "TURRET",    tab: "turrets" },
};
let zoneOrders = {};              // z → [{ kind, elId, level, tile, progress, status }]
function saveZoneOrders() { try { localStorage.setItem("conduit_zone_orders", JSON.stringify(Object.keys(zoneOrders).map(z => [z, zoneOrders[z].map(o => ({ kind: o.kind, elId: o.elId, level: o.level }))]))); } catch (e) {} }
function loadZoneOrders() {
    try { const r = JSON.parse(localStorage.getItem("conduit_zone_orders") || "[]"); zoneOrders = {}; for (const [z, list] of r) zoneOrders[z] = list.map(o => Object.assign({ progress: 0, status: "" }, o)); } catch (e) { zoneOrders = {}; }
}
function clearZoneOrders() { zoneOrders = {}; saveZoneOrders(); }
loadZoneOrders();

// ── the crew ──
function _isAntBuilder(a) { return !!a && a.isClone && a.speciesName === "ant" && !a.dead && a.team === "green"; }
function _isCoreWorker(a) { return !!a && a.isFollower && !a.isClone && a.element === "core" && !a.dead && a.team === "green"; }
function zoneCrew(z) { return actors.filter(a => a.crewZone === z && !a.dead); }
// Who could be sent: ant clones and core followers not already on a crew and not heading home to the Crystal.
function zoneCrewCandidates() { return actors.filter(a => (_isAntBuilder(a) || _isCoreWorker(a)) && a.crewZone === undefined && !a.returningToCrystal && (!a.job || a.job.type === "move")); }
function zoneCrewSummary(z) { const c = zoneCrew(z); return { ants: c.filter(_isAntBuilder).length, core: c.filter(_isCoreWorker).length, total: c.length }; }
function zoneSendCrew(z) {
    const say = (text, color) => floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color, life: 110, vy: -0.2, size: 12 }), name = z === 0 ? "HOME" : "ZONE " + z;
    const nest = zoneTeleportNest(z);
    if (!nest) { say("NO NEST HELD IN " + name + " TO SEND A CREW TO", "#f88"); return 0; }
    const pick = zoneCrewCandidates();
    if (!pick.length) { say("NO FREE ANT CLONES OR CORE WORKERS TO SEND", "#f88"); return 0; }
    const to = teleportSpot(nest);
    pick.forEach((a, i) => {
        const ang = i / Math.max(1, pick.length) * Math.PI * 2, x = to.x + Math.cos(ang) * 1.4, y = Math.max(0.3, Math.min(2.8, to.y + Math.sin(ang) * 0.9));
        a.x = a.lastX = x; a.y = a.lastY = y;
        if (a.isClone) setCloneDuty(a, "worker"); else if (typeof setFollowerDuty === "function") setFollowerDuty(a, "worker", true);
        const post = getTile(Math.round(x), Math.round(y)) || getTile(Math.round(to.x), 1);
        a.job = post ? { type: "move", target: post } : null; a.stance = "hold"; a.crewZone = z; a.returningToCrystal = false;
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x, y, color: "#8fe3ff", radius: 0.7, life: 24 });
    });
    if (typeof _cacheAge !== "undefined") _cacheAge = -9999;
    say(pick.length + " CREW SENT TO " + name, "#8fe3ff");
    return pick.length;
}
// RECALL: the crew leaves its post, comes back to you and goes back on the line.
function zoneRecallCrew(z) {
    const crew = zoneCrew(z); if (!crew.length) { floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: "NO CREW IN " + (z === 0 ? "HOME" : "ZONE " + z), color: "#8aa0c8", life: 90, vy: -0.2, size: 12 }); return 0; }
    crew.forEach((a, i) => {
        const ang = i / Math.max(1, crew.length) * Math.PI * 2; a.x = a.lastX = player.x + Math.cos(ang) * 1.3; a.y = a.lastY = Math.max(0.3, Math.min(2.8, player.y + Math.sin(ang) * 0.9));
        delete a.crewZone; a.job = null; a.stance = "follow"; if (a.isClone) setCloneDuty(a, "fighter"); else if (typeof setFollowerDuty === "function") setFollowerDuty(a, "fighter", true);
    });
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: crew.length + " CREW RECALLED", color: "#8fe3ff", life: 100, vy: -0.2, size: 12 });
    return crew.length;
}

// ── the orders ──
function zoneOrderTool(o) { return { tab: ORDER_KINDS[o.kind].tab, kind: o.kind, elId: o.kind === "generator" ? GENERATOR_ID : o.elId, label: ORDER_KINDS[o.kind].label, colour: "#8fe3ff" }; }
function _orderLevelKey(o) { return ORDER_KINDS[o.kind].tab; }
// Run fn with the build level set to the order's (the build rules read the global), then put it back.
function _withOrderLevel(o, fn) { const k = _orderLevelKey(o), was = buildLevel[k], wasTool = buildTool; buildLevel[k] = o.kind === "generator" ? 1 : (o.level || 1); try { return fn(zoneOrderTool(o)); } finally { buildLevel[k] = was; buildTool = wasTool; } }
function zoneOrderCost(o) { return _withOrderLevel(o, tool => buildToolCost(tool)); }
function zoneOrderLabel(o) {
    const el = o.kind === "generator" ? "" : (ELEMENTS.find(e => e.id === o.elId) || { label: o.elId }).label.toUpperCase() + " ";
    return el + ORDER_KINDS[o.kind].label + (o.kind === "battery" && o.level > 1 ? " " + BUILD_LEVELS.power[o.level - 1] : "");
}
function zoneAddOrder(z, o) {
    const say = (text, color) => floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color, life: 100, vy: -0.2, size: 12 });
    if (!ORDER_KINDS[o.kind]) return false;
    if (o.kind !== "generator" && !isPylonTypeUnlocked(o.elId)) { say("THAT ELEMENT IS NOT UNLOCKED", "#f88"); return false; }
    const list = zoneOrders[z] || (zoneOrders[z] = []);
    if (list.length >= ORDER_MAX) { say("THE ORDER QUEUE IS FULL (" + ORDER_MAX + ")", "#f88"); return false; }
    list.push({ kind: o.kind, elId: o.kind === "generator" ? GENERATOR_ID : o.elId, level: o.kind === "battery" ? (o.level || 1) : 1, progress: 0, status: "", tile: null });
    saveZoneOrders(); return true;
}
function zoneCancelOrder(z, i) { const list = zoneOrders[z]; if (!list || !list[i]) return false; list.splice(i, 1); if (!list.length) delete zoneOrders[z]; saveZoneOrders(); return true; }
// The tile an order would go on: the nearest the build rules accept to the zone's power (its generator, connectors and batteries; else its nest).
function zoneOrderTile(z, o) {
    const nest = zoneTeleportNest(z) || world.find(t => t.nest && getZoneIndex(t.x) === z);
    let ax = nest ? nest.x : z * ZONE_LENGTH + ZONE_LENGTH / 2, ay = nest ? nest.y : 1.5, n = 0, sx = 0, sy = 0;
    if (o.kind !== "generator") for (const t of world) if (t.pillar && !t.destroyed && t.pillarTeam === "green" && getZoneIndex(t.x) === z && (t.isGenerator || t.isConnector || t.isBattery)) { sx += t.x; sy += t.y; n++; }
    if (n) { ax = sx / n; ay = sy / n; }
    const cand = world.filter(t => t.type === "floor" && getZoneIndex(t.x) === z && t.y >= 0 && t.y <= 3).sort((a, b) => Math.hypot(a.x - ax, a.y - ay) - Math.hypot(b.x - ax, b.y - ay));
    return _withOrderLevel(o, tool => {
        let short = false;
        for (let i = 0; i < Math.min(cand.length, 400); i++) {
            const v = canBuildAt(cand[i], tool);
            if (v.ok) return { tile: cand[i], why: null };
            if (/^NEED \d+/.test(v.why)) short = true;
        }
        return { tile: null, why: short ? "WAITING FOR SHARDS" : "NO ROOM / NO POWER" };
    });
}
function zoneOrderTick() {
    if (((typeof frame !== "undefined" ? frame : 0) % 20) !== 0) return;
    for (const zs of Object.keys(zoneOrders)) {
        const z = +zs, list = zoneOrders[z]; if (!list || !list.length) continue;
        const ants = zoneCrew(z).filter(_isAntBuilder).length;
        if (!ants) { list.forEach(o => { o.status = "NO BUILDER IN THE ZONE"; }); continue; }
        // The first order that can go ahead is worked on. One that cannot (no room, no power yet: a battery before its generator) is passed over, so it
        // never blocks the ones behind it; one that only lacks shards holds the queue (you are saving for it).
        for (let i = 0; i < list.length; i++) {
            const o = list[i];
            if (!o.tile) { const r = zoneOrderTile(z, o); if (!r.tile) { o.status = r.why; if (r.why === "WAITING FOR SHARDS") break; continue; } o.tile = r.tile; }
            const cost = zoneOrderCost(o);
            if (shardCount < cost) { o.status = "WAITING FOR SHARDS (\u25c6" + cost + ")"; break; }
            o.progress += 20 * ants; o.status = "BUILDING " + Math.min(99, Math.round(100 * o.progress / ORDER_BUILD_FRAMES)) + "%";
            if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: o.tile.x, y: o.tile.y, color: "#8fe3ff", radius: 0.5, life: 20 });
            if (o.progress >= ORDER_BUILD_FRAMES) {
                const done = _withOrderLevel(o, tool => { buildTool = tool; return canBuildAt(o.tile, tool).ok && buildToolPlaceAt(o.tile); });
                if (done) { list.splice(i, 1); if (!list.length) delete zoneOrders[z]; saveZoneOrders(); }
                else { o.tile = null; o.progress = 0; o.status = "RETRYING"; }   // the ground changed under it: pick again
            }
            break;
        }
        // the ones behind the one being built are queued
        for (const o of list) if (!o.status || o.status === "RETRYING") o.status = "QUEUED";
    }
}
