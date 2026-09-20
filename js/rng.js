// ─────────────────────────────────────────────────────────
//  DETERMINISTIC WORLD GENERATION
//
//  Every Math.random() in generateSegment meant a refresh rebuilt a DIFFERENT
//  map — different pylon placement, different teams, different wall panels.
//  That is why reloading the page acted as a reset: nothing restored by
//  coordinate could line up with the terrain underneath it.
//
//  The layout now comes from a seed saved alongside the rest of the game. Each
//  segment draws from its own stream derived from that seed and its own x, so a
//  segment generates identically no matter when it is created — segments are
//  made lazily as the player walks forward, so generation order is not stable
//  and a single shared stream would not be either.
// ─────────────────────────────────────────────────────────

function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

let worldSeed = 0;

// Spawn keys of the neutral recruits still standing when the game was saved.
// null means "fresh game — spawn them all". Without this, a seeded world would
// hand the player the same recruits again on every refresh, so converting one
// and reloading would farm followers for free.
let restoredNpcKeys = null;

function initWorldSeed() {
    let stored = null;
    try { stored = localStorage.getItem("tubecrawler_seed"); } catch (e) {}
    const n = stored === null ? NaN : Number(stored);
    if (Number.isFinite(n) && (n | 0) !== 0) { worldSeed = n | 0; return worldSeed; }
    // 0 is not a usable seed for mulberry32's mixing, so keep drawing past it.
    worldSeed = (Math.random() * 0xFFFFFFFF) | 0;
    if (worldSeed === 0) worldSeed = 0x5EED;
    try { localStorage.setItem("tubecrawler_seed", String(worldSeed)); } catch (e) {}
    return worldSeed;
}

function clearWorldSeed() {
    worldSeed = 0;
    try { localStorage.removeItem("tubecrawler_seed"); } catch (e) {}
}

// One independent stream per segment.
function segmentRng(startX) {
    return mulberry32((worldSeed ^ Math.imul(startX | 0, 0x9E3779B1)) | 0);
}
