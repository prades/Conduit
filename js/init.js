// ─────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────
let health = PLAYER_HITS;     // hits left (js/config.js)

function loadConfig() {
    // The HUD's icons decode in the background (js/icons.js).
    if (typeof preloadIcons === "function") preloadIcons();
    if (typeof renderCloneCostIndex === "function") renderCloneCostIndex();   // the GAME INDEX's clone prices (js/clone.js)
    // THE GAME: the facility (js/facilityplay.js) — its map, its tutorial, its save. It is the only game the page has.
    facilityPlayStart();
    gameLoop();   // the clock (game.js): 60 game steps a second, drawn as often as the screen can
}

loadConfig();
