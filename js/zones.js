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
// CLEAR BROKEN pays the fee to bring the zone's broken equipment back at once instead of waiting for the repair crew (ants rebuild a wreck, a core
// worker re-arms a frame): a wreck stands again as the machine it was, and an offline frame is re-armed. The fee is shown before it is paid.
const ZONE_FEE_WRECK = 5;     // shards to bring a wrecked pylon back (half a new pylon: PYLON_BUILD_COST is 10)
const ZONE_FEE_FRAME = 3;     // shards to re-arm an offline frame
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
    };
}
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
// CLEAR BROKEN: pay the fee, and every wreck in the zone stands again as the machine it was, every offline frame is re-armed.
function zoneClearBroken(z) {
    const say = (text, color) => floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color, life: 110, vy: -0.2, size: 12 });
    const br = zoneBroken(z), fee = br.wrecks.length * ZONE_FEE_WRECK + br.frames.length * ZONE_FEE_FRAME;
    if (!br.wrecks.length && !br.frames.length) { say("NOTHING BROKEN IN " + (z === 0 ? "HOME" : "ZONE " + z), "#8aa0c8"); return 0; }
    if (shardCount < fee) { say("NEED " + fee + " SHARDS TO CLEAR " + (z === 0 ? "HOME" : "ZONE " + z), "#f44"); return 0; }
    shardCount -= fee; if (typeof saveShards === "function") saveShards();
    let n = 0;
    for (const t of br.wrecks) if (restoreBrokenPylon(t)) { n++; }
    for (const t of br.frames) if (rearmPylon(t)) { n++; }
    if (typeof _cacheAge !== "undefined") _cacheAge = -999;
    if (typeof savePylons === "function") { try { savePylons(); } catch (e) {} }
    for (const t of br.wrecks.concat(br.frames)) if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: t.x, y: t.y, color: "#19e6c1", radius: 0.5, life: 24 });
    say((z === 0 ? "HOME" : "ZONE " + z) + ": " + n + " BROKEN CLEARED — " + fee + " ◆", "#19e6c1");
    return n;
}
