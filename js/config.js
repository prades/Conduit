// ============================================================
//  CONFIG  —  the constants and the shared state every file reads
// ============================================================
// The game is THE FACILITY (js/facilityplay.js boots it; docs/FACILITY.md, docs/TUTORIAL.md). What is here is what more than one file needs: the elements, the canvas, the tile size, the lists of
// everything alive, the alarm, the Crystal, the player, the input and command state, the player's ultimate, the settings. A constant that one file alone uses lives in that file.

// The build this file belongs to — the same as window.__PAGE_BUILD and the
// ?v= on every script tag in game.html (the boot check compares them).
const BUILD_VERSION = "2026-10-28a";

// ── GLOBAL ERROR DISPLAY ──────────────────────────────────
// Lives in game.html (_showError), before any file loads. This file used to
// replace it with its own handler, which stacked a new panel per error so the
// first — the cause — was always hidden under the last.

// ── ELEMENTS ─────────────────────────────────────────────
const ELEMENTS = [
    { id:"fire",     label:"FIRE",     color:"#ff3300" },
    { id:"electric", label:"ELECTRIC", color:"#ffee33" },
    { id:"ice",      label:"ICE",      color:"#99ddff" },
    { id:"flux",     label:"FLUX",     color:"#9933ff" },
    { id:"core",     label:"CORE",     color:"#00ccaa" },
    { id:"toxic",    label:"TOXIC",    color:"#66ff66" }
];
// Every element is online from the start (ASKED: "make the crystal have access to all the colors from the beginning"): a follower is made of any of the six
// (js/clone.js modulationPick), and a creature carries one too (the type chart runs on every fight: js/elements.js getElementMultiplier, js/helpers.js applyDamage).
let unlockedElements = new Set(ELEMENTS.map(e => e.id));
// Every creature killed this game (js/helpers.js counts it).
let lifetimeKills = 0;

// ── CANVAS / CTX ──────────────────────────────────────────
const canvas  = document.getElementById('cavernCanvas');
// Opaque: every frame paints the whole canvas, so the browser need not blend
// it with the page behind (a cheaper composite on every frame).
let ctx       = canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d');
const hpBar   = document.getElementById('hp');
const ultBar  = document.getElementById('ult');
const ultWrap = document.getElementById('ultWrap');
const ultLabel= document.getElementById('ultLabel');
const siphonBtn = document.getElementById('siphonBtn');
const shardUI = document.getElementById('shardCount');   // the NUMBER inside the shard gems (js/hudgems.js)

// Safe area inset at the bottom (for notch/home-bar devices)
let SAFE_BOTTOM = 0;
let resizeCount = 0;   // how many times the canvas has been sized (the PERFORMANCE readout shows it: a number that keeps climbing is a browser firing resize events)
let viewZoom = 1;      // 1 = normal; < 1 = zoomed out (the website's background pulls back: js/attract.js)
function resize() {
    // Use visualViewport dimensions when available (better mobile support)
    const vv = window.visualViewport;
    // The picture is drawn on a canvas of (screen / viewZoom) pixels and shown at screen size by the css, so a viewZoom below 1 ZOOMS OUT: more of
    // the world fits. toCanvas() in js/input.js already maps a touch back through that scale.
    // Assigning a canvas's width or height (even to the size it already has) clears it and throws away its backing store, which the browser then has to build again: so it is only done when the size really changed (a
    // browser that fires visualViewport 'resize' events while nothing has moved would otherwise rebuild the picture's memory over and over).
    const cw = Math.round((vv ? vv.width : window.innerWidth) / viewZoom), ch = Math.round((vv ? vv.height : window.innerHeight) / viewZoom);
    resizeCount++;
    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;
    syncVisibleArea();
    // Detect bottom safe-area via a temporary DOM element
    try {
        const _tmp = document.createElement('div');
        _tmp.style.cssText = 'position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px);width:1px;pointer-events:none;opacity:0';
        document.body.appendChild(_tmp);
        SAFE_BOTTOM = Math.max(0, parseInt(getComputedStyle(_tmp).height) || 0);
        document.body.removeChild(_tmp);
    } catch(e) { SAFE_BOTTOM = 0; }
}
window.addEventListener('resize', resize);
if (window.visualViewport) { window.visualViewport.addEventListener('resize', resize); window.visualViewport.addEventListener('scroll', () => syncVisibleArea()); }
resize();
// THE VISIBLE AREA. On an iPad (and any browser with its own bars) the layout viewport that position:fixed and 100dvh are measured against can be TALLER
// than what is actually on screen, so everything anchored to the bottom (the dock, the chips) landed below the screen edge
// ("it looks bad on my iPad"). The visual viewport is the truth: its size is published as --vvw / --vvh, and the gap between the layout viewport's bottom
// and the visible bottom as --vv-bottom, which every bottom-anchored control adds to its own offset (game.html).
function syncVisibleArea() {
    try {
        const vv = window.visualViewport, root = document.documentElement; if (!root || !root.style) return;
        const lh = root.clientHeight || window.innerHeight, vw = vv ? vv.width : window.innerWidth, vh = vv ? vv.height : window.innerHeight, top = vv ? vv.offsetTop : 0;
        root.style.setProperty("--vvw", Math.round(vw) + "px"); root.style.setProperty("--vvh", Math.round(vh) + "px");
        root.style.setProperty("--vv-bottom", Math.max(0, Math.round(lh - (top + vh))) + "px");
        // The canvas is shown at exactly the visible size (its pixel size follows viewZoom, below).
        canvas.style.width = Math.round(vw) + "px"; canvas.style.height = Math.round(vh) + "px";
    } catch (e) {}
}
// Safari (iPad especially) often reports the wrong size at load and corrects it a moment later WITHOUT a resize event (the player saw it fixed only after
// switching away and back). So the visible area is also re-measured on every event that can mean it changed, shortly after load, and from the frame
// loop (js/game.js render, every VISIBLE_AREA_POLL_FRAMES): the loop is the game's only clock, so there is no timer of its own.
const VISIBLE_AREA_POLL_FRAMES = 30;
let _vaKey = "";
function checkVisibleArea() {
    const vv = window.visualViewport, key = [window.innerWidth, window.innerHeight, vv ? Math.round(vv.width) : 0, vv ? Math.round(vv.height) : 0, vv ? Math.round(vv.offsetTop) : 0, document.documentElement ? document.documentElement.clientHeight : 0].join(",");
    if (key === _vaKey) return false;
    _vaKey = key; if (typeof _cachedRect !== "undefined") _cachedRect = null; resize(); return true;
}
["orientationchange", "pageshow", "focus"].forEach(ev => window.addEventListener(ev, () => { checkVisibleArea(); setTimeout(checkVisibleArea, 150); setTimeout(checkVisibleArea, 600); }));
document.addEventListener("visibilitychange", () => { if (!document.hidden) { checkVisibleArea(); setTimeout(checkVisibleArea, 150); setTimeout(checkVisibleArea, 600); } });
[50, 300, 800, 2000, 4000].forEach(ms => setTimeout(checkVisibleArea, ms));
function setViewZoom(z) { if (z === viewZoom) return; viewZoom = z; if (typeof _cachedRect !== 'undefined') _cachedRect = null; resize(); }

// ── THE PLAYER'S LOOK (js/draw.js, js/hdsprites.js) ──────
const cfg = {
    exhaustFrequency: 7,
    smokeColor: "rgba(160,160,160,0.4)",
    bobSpeed: 0.12,
    bobAmount: 5,
    tiltIntensity: 0.15,
    rotationSmoothing: 0.15
};

// ── CONSTANTS ─────────────────────────────────────────────
const TILE_W = 60, TILE_H = 30, RENDER_DIST = 22;
// A role's name on screen. The ids ("brawler", "sniper", "camper") are what saves, tests and the code know them by;
// the ranged role is a MAGE to the player, and the post-holding role a TECHNICIAN.
const ROLE_LABELS = { sniper: "MAGE", camper: "TECHNICIAN" };
function roleLabel(role) { const k = String(role == null ? "" : role); return (ROLE_LABELS[k] || k).toUpperCase(); }
// How close two followers may stand before they push each other apart (tiles). It was 0.55; a bundle of evolved
// machines, wider than the eggs, hid each other at that, so they keep a little more room (see the separation pass in game.js).
const FOLLOWER_SEP = 0.75;
const LONG_HOLD_MS = 500;
const RADIAL_RADIUS = 60;
const FOLLOW_STOP  = 2.0;

// ── GAME STATE ────────────────────────────────────────────
// running: false once the Crystal has fallen (js/alarm.js showGameOver); NEW GAME reloads the page (js/facilitysave.js).
let gameState = { running: true };

// ── WORLD / ACTOR LISTS ───────────────────────────────────
let world      = [];
let worldTileMap = new Map(); // spatial hash: "x,y" → tile (O(1) lookup)
let actors     = [];
let followers  = [];
let followerByElement = {};
ELEMENTS.forEach(el => { followerByElement[el.id] = []; });

// ── HUD CHANGE-DETECTION CACHE (avoids DOM style writes every frame) ──────────
let _lastHpInt      = -1;    // last integer hp written to hpBar
let _lastUltInt     = -1;    // last integer ultimate written to ultBar
let _lastUltState   = '';    // last ready/surging class written
let _lastSiphonOn   = null;  // last siphon state written to siphonBtn
let _lastShardCount = -1;    // last shard count written to shardUI
let _lastPanelOpen  = false;  // a canvas panel (Clone Bay, Settings, the pack, the INFO panel) is up
let _lastAlarmOn    = false;  // the alarm triangle's state (game.js)
let _lastZoneName   = null;  // the room name last written to the room tag (js/facilitynet.js)
let _zoneEl         = null;  // cached zoneInfo element (fetched once on first use)

// ── THE ALARM (js/alarm.js) ───────────────────────────────
let alertActive = false;   // true while alarm is sounding
let alertTimer  = 0;       // frames remaining in current alarm
let alertType   = null;    // null | "proximity" | "facility"
let alertSource = null;    // { x, y } where alarm was triggered
const ALERT_DURATION = 600; // 10 seconds at 60fps

// ── THE EFFECTS PLAN ─────────────────────────────────────
// REPORTED: "the graphics and the atmospheric effects get way too crazy ...
// not just a giant mist everywhere." The plan, card by card, is the Conduit
// effects plan page; its rules: no fog (nothing tints the whole screen for
// longer than half a second), no blur, lines not discs, quiet when idle,
// capped (FX_MAX in elements.js), one voice (one centre banner at a time).
const FX_EMP_FRAMES   = 30;    // the EMP's dim: half a second …
const FX_EMP_DIM      = 0.35;  // … at this much
const FX_VIGNETTE     = 0.2;   // the eruption's red edges
const FX_CRATER_FRAMES = 300;  // the eruption's crater lasts 5 s
const FX_CRATER_ALPHA = 0.35;
const FX_FROST_ALPHA  = 0.08;  // the blizzard's frost over the floor of its field
// The crystal heals slowly while no alarm is up, so one bad fight is not a
// permanent wound: 0.01 a frame is 0.6 a second, about eight minutes from empty.
const CRYSTAL_REGEN = 0.01;

let projectiles = [], fragments = [], smoke = [], shards = [];
let floatingTexts = [];   // { x, y, text, color, life, vy, size } (js/drops.js draws them)
let followerProjectiles = []; // ranged attacks from snipers/specials
let respawnQueue = [];
let frame = 0, shake = 0;
let activeEmpEffect = null; // { timer, maxTimer } — the EMP's screen-darkening flash (js/elements.js)
// Every new play begins with this many crystals. A creature you kill pays its worth on the spot (js/drops.js), and a recruit costs RECRUIT_COST (js/clone.js).
const STARTING_SHARDS = 100;
let shardCount = 0;   // (set by facilityResetState, and put back by the save)

// ── THE FOLLOWER'S BASE TYPE (its egg: what every follower is made from, js/helpers.js spawnFollowerAtCrystal) ──
const NPC_TYPES = { virus: { maxHealth: 10, moveSpeed: 0.025, color: "#888", power: 5 } };

// ── CRYSTAL ───────────────────────────────────────────────
let crystal = { x:0, y:2, health:300, maxHealth:300, radius:0.8 };

// ── PLAYER ────────────────────────────────────────────────
let player = {
    x:2, y:1, visualX:2, visualY:1, targetX:2, targetY:1,
    rotY: Math.PI * 0.75, baseRot: Math.PI * 0.75,
    angryTimer: 0, selectedElement: "fire",
    siphonHold: 0,
    attackCooldown: 0,   // frames until next player shot
    invuln: 0            // damage-immune frames after a knockdown — control is never locked
};

// Frames of damage immunity after being put back at the Crystal. There is no
// stun any more: the player keeps control the whole time. The window only
// exists so a creature parked by the Crystal cannot chain-kill on respawn.
const PLAYER_RESPAWN_GRACE = 90;

// ── THREE HITS ────────────────────────────────────────────
// REPORTED: "the main character can only get hit three times by an insect or
// a predator, then they get knocked back to the Crystal and it resets to three."
//
// The player's health is a count of hits, not hit points: any hit takes ONE,
// however hard it was, and the third puts you back at the Crystal with all
// three again. Nothing scales it. After a hit, PLAYER_HIT_GRACE frames in which
// nothing lands, so one swarm's volley is one hit, not all three at once.
const PLAYER_HITS      = 3;
const PLAYER_HIT_GRACE = 60;

// ── INPUT STATE (js/input.js) ─────────────────────────────
let isPressing    = false;
let pressX = 0, pressY = 0;
let pressStartTime = 0;
let longHoldFired = false;
let touchMoved    = false;
let pointerX = 0, pointerY = 0;
let dragDX = 0, dragDY = 0;

// ── ULTIMATE DOUBLE-TAP STATE ─────────────────────────────
let _ultimateLastTapActor = null;   // follower actor tapped last
let _ultimateLastTapTime  = 0;      // performance.now() of last tap

// ── PLAYER WEAPON (js/gunfire.js, js/weapons.js) ──────────
// Firing is gated behind an explicit attack mode (the dial at the top left, the long-press ring), and costs ammo.
let playerAttackMode = false;
let playerAmmo       = 0;
const PLAYER_AMMO_MAX   = 60;
const PLAYER_AMMO_START = 12;
// The smallest distance a follower divides by when it steers off a target. At
// exactly 0 a unit standing on its target produces NaN, which is permanent.
const NPC_MIN_DIST = 0.001;

// ── CLONES (js/clone.js) ──────────────────────────────────
// A clone is the same creature fighting for you, and it is meant to be a
// better one: four times the health its species has, and more power. It
// costs crystals and DNA that came from killing one, so it should feel like
// an upgrade rather than a copy. Every way a clone is made goes through
// makeClone(), so every one of them gets this.
// THE POWER WAS NEVER USED until the Mutator's clone (docs/MUTATOR.md): a clone struck with a follower's plain swing (1.25 a hit) whatever its power. Now that it bites with it, four times (the old number)
// killed a creature of its own kind and level in ONE bite; 1.5 takes three, so a fight can be read (docs/COMBAT.md) and the clone's upgrades have room to make it a "super soldier". TENTATIVE: a knob, not a decision.
const CLONE_POWER_MULT  = 1.5;
const CLONE_HEALTH_MULT = 4;
// Followers respawn in 3 seconds. A clone is worth far more than that, so
// losing one has to cost something — it comes back, slowly, and the Crystal
// shows the countdown.
const CLONE_RESPAWN_FRAMES = 1200;   // 20 seconds
let _ATKCHIP = { x: 0, y: 0, w: 0, h: 0 };   // the ammo icon by the dial (js/targeting.js), tap to disarm

// ── COMMAND / RADIAL STATE (js/commands.js, js/input.js, js/draw.js) ──
let commandMode = false;
let commandX = 0, commandY = 0;
// How far the ring was moved to keep it on screen (handleLongHold): it is drawn
// at commandX/Y, but a DRAG is still measured from where the finger went down.
let commandShiftX = 0, commandShiftY = 0;
let commandTarget = null;
let commandEnemyTarget = null;  // creature under a long press, if any
let commandFollowerTarget = null;  // own follower under a long press, if any
let commandBodyTarget = null;  // a fallen clone's body under a long press, if any (js/mutator.js)
let selectedRadialAction = null;
let commandPendingTap    = false;  // true = menu open, waiting for button tap

// ── INFO PANEL (canvas-drawn, js/infodex.js) ──────────────
let infoPanelOpen   = false;
let infoPanelTarget = null;
let infoPanelPage   = null;   // null = the readout of what was pressed | 'codex' (the index)
let infoPanelSubject = null;  // what the press hit besides the tile: { follower, enemy }

// ── WHO THE ORDERS GO TO (js/mixtool.js, js/radialmenu.js, js/helpers.js getCommandPool) ──
let squadMode    = "selected"; // "all" | "selected" (the facility starts it on "all")
let selectedRole = null;       // "brawler"|"sniper"|"camper"|null  ("sniper" is shown to the player as MAGE and "camper" as TECHNICIAN: see roleLabel)
let crystalMenuOpen  = false;      // the battle tool is open (a phone; js/mixtool.js)
let crystalCloneSort = "species";  // the Clone Bay's sort: "species"|"combat"|"defense"|"hp"|"specials"
// THE BATTLE CONTROLS (js/mixtool.js): the enemy class your followers go for first (null = whoever is nearest), and how long a RETREAT keeps them out of the fight.
let battleFocus = null;
const BATTLE_FOCUS_CLASSES = ["striker", "tank", "scout", "boss"];
const BATTLE_RETREAT_FRAMES = 360;   // six seconds
const BATTLE_FOCUS_REACH = 10;        // tiles: a focus target further than this is not chased
// AN ATTACK ORDER (the enemy card in the battle tool, js/mixtool.js): the picked units go for that ONE creature, whatever is nearer, until it is dead, this long has passed, it is further from you than the leash (you have moved on), or they are given another order.
const BATTLE_ATTACK_FRAMES = 1800;    // thirty seconds
const BATTLE_ATTACK_LEASH = 22;       // tiles from the player

// ── WHO CREATURES WILL BITE ───────────────────────────────
// REPORTED: "They should turn to hit you if you're super close, and they
// won't shoot at you. If you brush up against them or they walk up to you,
// they hit you — and you get knocked back a little after each hit."
//
// REPORTED later: "it feels like I'm invulnerable [...] they should feel more dangerous, make them target you if you are weak especially. They should target weak targets
// and the player has a health bar too. They should also target you if you attack them."
//
// You are a creature's PREY like your squad (COMBAT.prey, js/combat.js): one you hit or touch (within PLAYER_BITE_RANGE) turns on you, and one in a fight goes for the weakest
// near it, a weak player above all (your three hits are your health bar). It chases you and bites in the bite's two beats: it rears back (the telegraph, over you), then
// the bite is ONE of your three hits (the grace after it, PLAYER_HIT_GRACE, spaces them out), and you are pushed PLAYER_KNOCKBACK tiles away from it. Step out of its reach
// while it rears back and the bite misses (DODGED). Its shots and specials still pass you by. Burning ground (js/firebombs.js) still costs a hit.
const PREDATORS_ATTACK_PLAYER = true;
const PLAYER_BITE_RANGE    = 0.9;   // tiles
const PLAYER_KNOCKBACK     = 0.7;   // tiles you are pushed per hit

// ── PLAYER ULTIMATE (js/helpers.js) ───────────────────────
// One bar, the character's own, filled by the siphon and spent on an ARMY SURGE:
// every unit you own healed, its WILL refilled, its own ultimate charged, and
// harder-hitting for the duration.
//
// This is NOT the same thing as FOLLOWER_ULTIMATES in js/elements.js, which are
// per-follower, charge individually and fire on a double-tap. The surge charges all of them at once.
const PLAYER_ULT_MAX      = 100;
const ARMY_SURGE_FRAMES   = 600;   // ten seconds
const ARMY_SURGE_POWER    = 1.6;   // damage multiplier for the whole army
// The bar is SIPHONED from the squad, not earned from kills. Each follower
// sends a small wisp of static to the player every SIPHON_INTERVAL frames, and
// the charge is delivered when the wisp arrives — so the trickle you can see is
// the transfer itself rather than decoration over a counter.
//
// The rate therefore scales with how many followers you are fielding: ten of
// them fill the bar in about half a minute, three take a couple of minutes, and
// with none it does not fill at all.
// Only followers NEAR you are drawn from. 6 tiles: brawlers close to
// FOLLOW_STOP (2.0) and mages hold at 4.0, so both count with slack for
// combat drift, while a follower holding a room across the facility does not.
const SIPHON_RANGE     = 6;
const SIPHON_INTERVAL  = 120;      // frames between one follower's wisps
const SIPHON_TRAVEL    = 34;       // frames a wisp takes to reach the player
const SIPHON_PER_WISP  = 0.7;      // charge one arriving wisp carries
const SIPHON_COLOUR    = "#ffee33";// electric — it is static, not element magic
let playerUltimate = 0;            // 0 .. PLAYER_ULT_MAX
let armySurgeTimer = 0;            // frames of surge left
let siphonEnabled  = true;         // the player can switch the draw off
let siphonWisps    = [];           // { ax, ay, t, seed } in flight
let _siphonInRange = 0;            // units the siphon can reach, for the HUD

// ── SETTINGS PANEL (canvas-drawn, js/settings.js) ─────────
let settingsPanelOpen    = false;
// ── GRAPHICS & THE PERFORMANCE READOUT (Settings) ─────────
// REPORTED: "the game runs pretty slow still." LOW graphics leaves out what is
// only decoration — smoke and debris, siphon wisps, heal pluses — and nothing
// the player reads to play. The readout shows FPS and where each frame's time
// goes, measured on the device itself. Both are remembered, under the facility's own keys
// (the only keys the page writes: js/facilityplay.js _fpNoStorage; a slow device sets LOW by itself, js/propsprites.js).
let gfxLow = false, perfReadout = false;
try { gfxLow = localStorage.getItem("conduit_fp_gfx") === "low"; perfReadout = localStorage.getItem("conduit_fp_perf") === "1"; } catch (e) {}
function toggleGfxLow() { gfxLow = !gfxLow; try { localStorage.setItem("conduit_fp_gfx", gfxLow ? "low" : "high"); if (typeof _fp !== "undefined" && _fp) _fp.gfxSaved = gfxLow ? "low" : "high"; } catch (e) {}
    if (gfxLow) { smoke.length = 0; fragments.length = 0; } }
function togglePerfReadout() { perfReadout = !perfReadout; try { localStorage.setItem("conduit_fp_perf", perfReadout ? "1" : "0"); } catch (e) {} }
let settingsResetConfirm = false;   // true = showing "ARE YOU SURE?" step

// ── THE GAME INDEX (game.html #controlsMenu, the dock's ? button) ──
function toggleControlsMenu() {
    const m = document.getElementById("controlsMenu");
    if (!m) return;
    const isHidden = !m.style.display || m.style.display === "none";
    if (isHidden) {
        m.style.display = "flex";
        m.style.flexDirection = "column";
        m.classList.remove("minimized");
        const minBtn = document.getElementById("cm-minimize");
        if (minBtn) minBtn.textContent = "─";
    } else {
        m.style.display = "none";
    }
}
function minimizeControlsMenu() {
    const m = document.getElementById("controlsMenu");
    if (!m) return;
    const minBtn = document.getElementById("cm-minimize");
    if (m.classList.contains("minimized")) {
        m.classList.remove("minimized");
        m.style.top = "50%";
        m.style.bottom = "";
        m.style.transform = "translate(-50%, -50%)";
        if (minBtn) minBtn.textContent = "─";
    } else {
        m.classList.add("minimized");
        if (minBtn) minBtn.textContent = "▣";
    }
}
