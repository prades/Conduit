// ============================================================
//  build ver. 0.0200  –  stat system + roles + personalities
// ============================================================

// ── GLOBAL ERROR DISPLAY ──────────────────────────────────
window.onerror = function(msg, src, line, col, err) {
    const e = document.createElement("div");
    Object.assign(e.style, {
        position:"fixed", top:"0", left:"0", right:"0",
        background:"rgba(0,0,0,0.9)", color:"#ff5555",
        font:"12px monospace", padding:"10px",
        zIndex:"99999", whiteSpace:"pre-wrap"
    });
    e.textContent = "CRASH\n\n" + msg + "\nLine:" + line +
        (err && err.stack ? "\n\n" + err.stack : "");
    document.body.appendChild(e);
};

// ── ELEMENTS ─────────────────────────────────────────────
const ELEMENTS = [
    { id:"fire",     label:"FIRE",     color:"#ff3300" },
    { id:"electric", label:"ELECTRIC", color:"#ffee33" },
    { id:"ice",      label:"ICE",      color:"#99ddff" },
    { id:"flux",     label:"FLUX",     color:"#9933ff" },
    { id:"core",     label:"CORE",     color:"#00ccaa" },
    { id:"toxic",    label:"TOXIC",    color:"#66ff66" }
];
// What you begin with. Named once because four places used to spell the list
// out, and the wave ladder is defined as "everything that is not one of these"
// — another copy would quietly decide which elements are earnable.
//
// Was ["fire", "electric"]. Now five of the six, which leaves ICE as the only
// thing left on the wave-unlock ladder: you start with every worker job except
// the ice block, so the whole work crew is available from the first round
// rather than two thirds of it being locked behind waves.
const STARTING_ELEMENTS = ["electric", "core", "toxic", "flux", "fire"];
let unlockedElements = new Set(STARTING_ELEMENTS);
// Elements earned by kills but not yet brought online at the Crystal.
let pendingElements = [];
// Every enemy killed this game. Cumulative and one-way — it is what earns
// elements, so it persists.
let lifetimeKills = 0;
// Set when a newly activated element is LEFT OUT of the mix, so the game can
// prompt the player that there is something to decide.
//
// It used to be set on every activation, including the usual case where the
// player has never narrowed the mix — an empty mask means "any", so the new
// element was already in it and there was nothing to re-modulate. The prompt
// lit anyway, and the only thing that cleared it was toggling a swatch, which
// would have taken an element OUT of the mix. So the ring stayed on for the
// rest of the game and the one way to dismiss it made the squad worse.
// Cleared by re-modulating, or by opening the control and seeing the mix.
let modulationDirty = false;

// ── PYLON LOOK ────────────────────────────────────────────
// One design for every pylon and every upgrade. There used to be six random
// bodies (spire, monolith, antenna, shrine, conduit); the sentinel fortress
// was the only one that read well at this scale, so it is now the whole set.
const PYLON_STYLE = "sentinel";
// Sentinel's palette, named once so the wall panelling can be trimmed to match
// rather than carrying its own separate greens.
const SENTINEL_FRONT_ACTIVE = "#1a2030";
const SENTINEL_FRONT_DORMANT= "#252830";
const SENTINEL_RIGHT_ACTIVE = "#0d1520";
const SENTINEL_RIGHT_DORMANT= "#181b20";
const SENTINEL_TOP_ACTIVE   = "#2a3545";
const SENTINEL_TOP_DORMANT  = "#343840";
const SENTINEL_FRONT_UPGRADED= "#0d1825";
const SENTINEL_RIGHT_UPGRADED= "#081018";
const SENTINEL_TOP_UPGRADED  = "#1a2535";
const SENTINEL_SLIT         = "#050508";
const SENTINEL_ACCENT       = "#7fb8dc";   // the cool steel highlight
const SENTINEL_ACCENT_DIM   = "#3d4d5e";

// ── GENERATOR PYLON ───────────────────────────────────────
// A neutral pylon: no elemental zone, no tier, no network. It does two things
// nothing else can — it is the only structure a nest will link to, and it
// mends the friendly pylons standing around it. Deliberately not in ELEMENTS:
// that list is what followers are made of and what the elemental network is
// tiered on, and a generator is neither.
const GENERATOR_ID    = "generator";
const GENERATOR_LABEL = "SHIELD GENERATOR";
const GENERATOR_COLOR = "#cdd6e0";   // neutral steel, so it reads as no element
// ── CONNECTOR PYLON ───────────────────────────────────────
// "A connector pylon with a really long radius of connection strength, used to
// carry power from the nests to power the zones in the later half — and you can
// turn the circuitry on or off to turn on a whole group of pylons at once."
//
// A neutral relay like the generator: it is built near a nest, linked to one,
// and draws from it. Where a generator only reaches the pylons beside it, a
// connector feeds EVERY pylon inside CONNECTOR_RANGE, so a single one run out
// to a distant zone lights the whole cluster there. Its circuit is a switch:
// open, it feeds nothing and that whole cluster goes dark together.
const CONNECTOR_ID    = "connector";
const CONNECTOR_LABEL = "CONNECTOR";
const CONNECTOR_COLOR = "#ffd24a";
const CONNECTOR_RANGE = 14;   // tiles — over four times a plain pylon link
// A relay is either kind of neutral power structure.
function isRelayId(id) { return id === GENERATOR_ID || id === CONNECTOR_ID; }
let _conPylons = [];   // live connector pylons
// What the pylon picker offers: the six elements plus the two relays.
const PYLON_PICKER_TYPES = [...ELEMENTS,
    { id: GENERATOR_ID, label: GENERATOR_LABEL, color: GENERATOR_COLOR },
    { id: CONNECTOR_ID, label: CONNECTOR_LABEL, color: CONNECTOR_COLOR }];
// Healing: applied every GENERATOR_HEAL_INTERVAL frames to each linked pylon.
// 2 HP per 30 frames is 4 HP/s — worth building around, but well under what a
// single predator chewing on a pylon takes off it.
const GENERATOR_HEAL_INTERVAL = 30;
const GENERATOR_HEAL_AMOUNT   = 2;
let _genPylons = [];   // live generator pylons
let _genLinks  = [];   // [{ gen, pylon }] — generator → pylon it is mending

// How far from a nest a generator may be placed. Linking a broken nest is the
// generator's whole reason to exist on that side, so one built out of reach of
// every nest could never do the job — the placement is refused rather than
// letting the player spend the build cost on a dead structure. The same range gates
// the link itself, so anything you are allowed to build can always connect.
const GENERATOR_NEST_RANGE = 6;
// ── The generator's HEALING AURA ─────────────────────────
// A pylon linked to a generator does not just keep itself standing — it mends
// whoever is standing near it. The rate and the reach are multiplied by that
// pylon's own NETWORK TIER, so a lone linked pylon is a trickle and a tier III
// network is a field hospital. Tier 0 means "not networked at all", and the
// floor of 1 keeps a linked pylon from being worth nothing.
const GEN_AURA_INTERVAL = 20;    // frames between pulses
const GEN_AURA_HEAL     = 0.9;   // HP per pulse, per tier
const GEN_AURA_RADIUS   = 1.8;   // tiles at tier 1
const GEN_AURA_PER_TIER = 0.5;   // extra tiles per tier above the first

// The nest a generator at (x, y) would serve, or null if none is in reach.
// Dead nests count: a broken nest is exactly the one you link.
function nestInGeneratorRange(x, y) {
    let best = null, bestD = GENERATOR_NEST_RANGE;
    for (const t of world) {
        if (!t.nest) continue;
        const d = Math.hypot(t.x - x, t.y - y);
        if (d <= bestD) { bestD = d; best = t; }
    }
    return best;
}

// Whether a generator may be placed on this tile, and the nest it would serve.
function canPlaceGenerator(t) {
    if (!t) return { ok: false, nest: null };
    const nest = nestInGeneratorRange(t.x, t.y);
    return { ok: !!nest, nest };
}

// One refusal, so every path says the same thing.
function refuseGenerator(el) {
    floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 80,
        text: ((el && el.id === CONNECTOR_ID) ? "CONNECTOR" : "GENERATOR") + " MUST BE WITHIN " + GENERATOR_NEST_RANGE + " TILES OF A NEST",
        color: "#f44", life: 120, vy: -0.2 });
}

// A generator is a pylon, so every pylon check still applies to it; this is
// only the "which kind" test.
function isGeneratorPylon(t) {
    return !!(t && t.pillar && !t.destroyed && t.health > 0 && t.isGenerator);
}
function isConnectorPylon(t) {
    return !!(t && t.pillar && !t.destroyed && t.health > 0 && t.isConnector);
}
// Either neutral relay: carries power, spends none, holds no element.
// A relay that has a switch you can flip: either kind can be turned off. Off, a
// generator feeds nothing (and mends nothing) and a connector feeds nothing, so
// whatever hangs off it goes dark until it is turned back on.
function isSwitchableRelay(t) { return isGeneratorPylon(t) || isConnectorPylon(t); }
function isRelayPylon(t) { return !!(t && (t.isGenerator || t.isConnector)); }

// The generator is neutral, so it is never behind an element unlock — it is
// available from the first pylon the player ever builds.
function isPylonTypeUnlocked(id) {
    return isRelayId(id) || unlockedElements.has(id);
}

// ── CANVAS / CTX ──────────────────────────────────────────
const canvas  = document.getElementById('cavernCanvas');
const ctx     = canvas.getContext('2d');
const hpBar   = document.getElementById('hp');
const ultBar  = document.getElementById('ult');
const ultWrap = document.getElementById('ultWrap');
const ultLabel= document.getElementById('ultLabel');
const siphonBtn = document.getElementById('siphonBtn');
const shardUI = document.getElementById('shards');
const waveUI  = document.getElementById('waveInfo');

// Safe area inset at the bottom (for notch/home-bar devices)
let SAFE_BOTTOM = 0;
function resize() {
    // Use visualViewport dimensions when available (better mobile support)
    const vv = window.visualViewport;
    canvas.width  = vv ? Math.round(vv.width)  : window.innerWidth;
    canvas.height = vv ? Math.round(vv.height) : window.innerHeight;
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
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
resize();

// ── CONFIG ────────────────────────────────────────────────
let cfg = {
    playerSpeed: 0.12,
    healthDecay: 0.025,
    pillarSpawnRate: 0.15,
    exhaustFrequency: 7,
    smokeColor: "rgba(160,160,160,0.4)",
    bobSpeed: 0.12,
    bobAmount: 5,
    tiltIntensity: 0.15,
    rotationSmoothing: 0.15
};
cfg.npcSpawnRate = 0.22;

// ── CONSTANTS ─────────────────────────────────────────────
const TILE_W = 60, TILE_H = 30, RENDER_DIST = 22;
const ZONE_LENGTH  = 15;
// How much tunnel a NEW game starts with: enough to cover the zones a fresh
// save can reach (activeDayZones caps at 5) with room to walk into. A saved
// game digs further than this, and the boot follows it out — see ensureWorldTo.
const WORLD_OPENING_COLUMNS = 80;
const LONG_HOLD_MS = 500;
const RADIAL_RADIUS = 60;
const FOLLOW_STOP  = 2.0;

// ── GAME STATE ────────────────────────────────────────────
let gameState = {
    phase: "day",       // "day" | "night" | "waveComplete" | "gameOver" | "shop"
    nightNumber: 1,
    totalWavesSurvived: 0,
    highestZoneCleared: 0,  // highest zone index the player has cleared a wave in
    running: true
};

let dayStats = { redSpawned: 0, redConverted: 0 };

// ── WORLD / ACTOR LISTS ───────────────────────────────────
let world      = [];
let worldTileMap = new Map(); // spatial hash: "x,y" → tile (O(1) lookup)
let actors     = [];
let followers  = [];
let followerByElement = {};
ELEMENTS.forEach(el => { followerByElement[el.id] = []; });

// ── WORLD SUBSET CACHES (refreshed every 60 frames) ──────
let _wPylons    = [];  // wave-mode pylons
let _aPylons    = [];  // attack-mode pylons
let _uPylons    = [];  // upgraded pylons
let _nestCache  = [];  // nest tiles
let _pillarCache= [];  // all live pillars
let _cacheAge   = -999;
let _wPylonPairs       = [];       // pre-computed connected pylon pairs (rebuilt with _wPylons)
let _pylonsWithPartner = new Set(); // pylons that have ≥1 connected partner (rebuilt with _wPylonPairs)
let _wallPanelMap      = null;     // worldX → wall_panel tile (rebuilt with _pillarCache)
let _wallPanelCache    = [];       // unactivated wall_panel tiles (rebuilt every 60 frames, spliced on activation)
let _capturableNodeCache = [];     // all capturable world tiles (rebuilt every 60 frames)
let _seasonBonusCache= {};  // seasoned-bonus multiplier per element (1.0 or 1.25)

// ── HUD CHANGE-DETECTION CACHE (avoids DOM style writes every frame) ──────────
let _lastHpInt      = -1;    // last integer hp written to hpBar
let _lastUltInt     = -1;    // last integer ultimate written to ultBar
let _lastUltState   = '';    // last ready/surging class written
let _lastSiphonOn   = null;  // last siphon state written to siphonBtn
let _lastShardCount = -1;    // last shard count written to shardUI
let _lastZoneIndex  = -999;  // last zone index written to zoneInfo
let _zoneEl         = null;  // cached zoneInfo element (fetched once on first use)
let _lastPadHudKey  = null;  // last value written to padHud (avoids DOM writes every frame)
let _padHudEl       = null;  // cached padHud element

// ── NETWORK RESONANCE STATE ─────────────────────────────────────────
// networkStrength[el]  : tier 0-3 based on largest connected same-element group
// networkIntegrity[el] : 0-100, accumulates while the network is active; resets on collapse
// _prevNetworkTiers[el]: used to detect tier-ups for notification
let networkStrength   = {};
let networkIntegrity  = {};
let _prevNetworkTiers = {};

// ── INTRUDER ALERT STATE ──────────────────────────────────
let alertActive = false;   // true while alarm is sounding
let alertTimer  = 0;       // frames remaining in current alarm
let alertType   = null;    // null | "proximity" | "zone" | "facility"
let alertSource = null;    // { x, y } where alarm was triggered
let alertZone   = null;    // zone index where the alarm was triggered
const ALERT_DURATION = 600; // 10 seconds at 60fps

// ── PYLON AGGRO ───────────────────────────────────────────
// Exposure needed before a predator stuck in a pylon zone turns on the pylon.
// Counted once every three frames, so 45 is about 2.2 seconds. A FLUX zone
// counts triple because it physically holds them in place — that is the one
// that made the game unplayable to sit and watch.
// ELECTRIC WAVE HASTE — the move-speed multiplier a friendly gets while standing
// in an electric wave zone, by network tier. It lingers ELECTRIC_HASTE_FRAMES
// after they step out, so the edge of the zone does not stutter.
// A turret-mode pylon wears a gun that tracks anything hostile inside
// attackRange x this.
// THE TURRET'S REACH, in one place. REPORTED (again): "I still don't
// understand why the turrets do not fire at enemies." Measured: a page reload
// restored every turret WITHOUT attackRange or attackPower — savePylons never
// wrote them — so the firing check compared against undefined, matched
// nothing, and the turret never fired again; the gun still tracked, because
// the aim used a 2.5 fallback. Every read now falls back to these, and the save
// keeps them.
const TURRET_RANGE = 3;
// DESTROY: take down one of your own pylons for good and get this many shards
// back (it cost PYLON_BUILD_COST to build).
const DEMOLISH_REFUND = 8;
// ── THE SHIELD GENERATOR ─────────────────────────────────
// "Replace the generator with shield generator ... a little bit thicker of a
// pylon ... a giant light coloured orb ... it starts creating shields for all
// the followers, and the shields take 100% of damage whenever the shield is
// active ... until the shield breaks and then the enemies are attacking their
// health directly." It still carries power from a nest to your pylons, and
// still mends them; the healing aura is replaced by this field. Every
// SHIELD_GEN_INTERVAL frames, each follower and clone within SHIELD_GEN_RANGE
// of a switched-on, nest-fed shield generator gains SHIELD_GEN_RATE shield, up
// to SHIELD_GEN_SHARE of its max health (at least SHIELD_GEN_MIN), paying
// SHIELD_GEN_COST power per point. A shield soaks every hit whole until it
// breaks (applyDamage); after a hit it waits SHIELD_GEN_DELAY before charging.
const SHIELD_GEN_RANGE    = 4;     // tiles round the shield generator
const SHIELD_GEN_INTERVAL = 30;    // frames between charges
const SHIELD_GEN_RATE     = 5;     // shield per charge
const SHIELD_GEN_SHARE    = 0.5;   // cap: this share of the unit's max health …
const SHIELD_GEN_MIN      = 20;    // … but never less than this
const SHIELD_GEN_DELAY    = 180;   // frames after a hit before it charges again
const SHIELD_GEN_COST     = 0.05;  // nest power per shield point
const SHIELD_GEN_COLOR    = "#dff3ff";
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
const FX_FROST_ALPHA  = 0.08;  // the blizzard's frost over its zone's floor
// ── AN ENDLESS TUNNEL ────────────────────────────────────
// REPORTED: "the game stops at zone 13, no predators spawn. Make sure the game
// is infinite and the enemies scale throughout and become bigger."
// The spawner only ever looped over zones 1..min(night, 12), so zone 13 on had
// no predators — and a hacked zone 13 had a kill quota nothing could meet.
// Spawning now follows the FRONTIER: the zones from ZONE_SPAWN_BEHIND behind
// the next one to take to ZONE_SPAWN_AHEAD past it, however deep that is.
const ZONE_SPAWN_BEHIND = 3;
const ZONE_SPAWN_AHEAD  = 2;
// Past the last designed species (zone 12) every zone deeper makes its
// predators tougher, harder-hitting, BIGGER and richer, without end.
const DEEP_ZONE_FROM     = 13;
const DEEP_HP_GROWTH     = 1.09;   // × health per zone past 12
const DEEP_POWER_GROWTH  = 1.07;   // × damage per zone past 12
const DEEP_SIZE_GROWTH   = 0.05;   // + body size per zone past 12 …
const DEEP_SIZE_MAX      = 2.5;    // … up to this many times their normal size
const DEEP_REWARD_GROWTH = 0.10;   // + shard and DNA drops per zone past 12
// ── THE DIFFICULTY RAMP ──────────────────────────────────
// REPORTED: "I feel the game is too easy right now" — enemies die too fast,
// nights are too short, the squad is never in danger. Asked to ramp with
// depth: zones 1-2 stay as they are; from zone 3 every zone deeper (up to
// RAMP_CAP of them) makes predators tougher and harder-hitting, raises the
// night's kill quota and sends more of them after your pylons. It stacks with
// the endless deep-zone growth past zone 12.
const RAMP_FROM        = 3;
const RAMP_CAP         = 10;     // levels: the ramp is complete by zone 12
const RAMP_HP          = 0.25;   // + health per level (zone 6: ×2, zone 12: ×3.5)
const RAMP_POWER       = 0.15;   // + damage per level (zone 12: ×2.5)
const RAMP_QUOTA       = 1.5;    // + kills a night needs per level
const RAMP_HUNTERS     = 0.05;   // + share of predators that hunt pylons per level …
const RAMP_HUNTERS_MAX = 0.6;    // … up to this share
const NIGHT_QUOTA_MAX  = 45;     // most kills a night can ask for, however deep
function rampLevel(z) { return Math.max(0, Math.min(RAMP_CAP, z - (RAMP_FROM - 1))); }
// Every predator is made its zone's difficulty here: the ramp, then the deep
// zones. Both ways a predator is made call it (the zone spawner, a nest hatch).
function applyZoneDifficulty(p, z) {
    if (!p || p._zoneScaled) return p;
    p._zoneScaled = true;
    const r = rampLevel(z);
    if (r > 0) {
        p.maxHealth = Math.round(p.maxHealth * (1 + RAMP_HP * r)); p.health = p.maxHealth;
        p.power = Math.round(p.power * (1 + RAMP_POWER * r));
        if (!p.isBrood && Math.random() < Math.min(RAMP_HUNTERS_MAX, (typeof PYLON_HUNTER_SHARE !== "undefined" ? PYLON_HUNTER_SHARE : 0.25) + RAMP_HUNTERS * r)) p.huntsPylons = true;
        p.rampLevel = r;
    }
    return applyDeepZone(p, z);
}
function deepZoneLevel(z) { return Math.max(0, z - (DEEP_ZONE_FROM - 1)); }
function deepZoneScale(z) {
    const d = deepZoneLevel(z);
    return { hp: Math.pow(DEEP_HP_GROWTH, d), power: Math.pow(DEEP_POWER_GROWTH, d),
             size: Math.min(DEEP_SIZE_MAX, 1 + DEEP_SIZE_GROWTH * d), reward: 1 + DEEP_REWARD_GROWTH * d };
}
// One place that makes a predator its zone's depth — every way one is made
// calls it (the zone spawner, and a nest hatching from hauled mass), after the
// body shaping, which would otherwise reset the size.
function applyDeepZone(p, z) {
    if (!p || p.deepLevel !== undefined || deepZoneLevel(z) <= 0) return p;
    const k = deepZoneScale(z);
    p.maxHealth = Math.round(p.maxHealth * k.hp); p.health = p.maxHealth;
    p.power = Math.round(p.power * k.power);
    if (p.dimensions) { p.dimensions.width = Math.round(p.dimensions.width * k.size); p.dimensions.height = Math.round(p.dimensions.height * k.size); }
    p.shardDrop = Math.round((p.shardDrop || 2) * k.reward);
    p.dnaDrops  = Math.round((p.dnaDrops || 1) * k.reward);
    p.deepLevel = deepZoneLevel(z);
    return p;
}
const TURRET_POWER = 15;
// The gun turns toward a target a little before it is in range — only a little,
// so it does not swing onto things it cannot hit (which read as "not firing").
const TURRET_TRACK_RANGE_MULT = 1.2;
// Every turret round hits this much harder than the pylon's base attack power.
// REPORTED twice: turrets "do not do any damage". Measured: one slow bolt every
// 1.5s for ~26 — 16 a second, against predators with 60 HP in zone 1 and up to
// 1300 later. So a turret now fires every TURRET_FIRE_FRAMES, hits at once (no
// bolt to dodge), adds TURRET_TIER_BONUS per network tier of its element, and
// bites TURRET_MAXHP_SHARE of the target's max HP on top, so it still matters
// against the big ones.
const TURRET_DAMAGE_MULT  = 2.5;
const TURRET_FIRE_FRAMES  = 45;     // 0.75s between rounds
const TURRET_TIER_BONUS   = 0.35;   // +35% per network tier (I, II, III)
const TURRET_MAXHP_SHARE  = 0.05;   // + 5% of the target's max HP
// REPORTED: "the turrets are 100% not firing". A turret with no generator or
// connector in reach had no power, and an unpowered turret never fired — so
// every turret built before a generator stood silent. Now a turret ALWAYS
// fires. Fed by a generator, each round is paid for and CHARGED (full damage);
// with no power, or an empty pool, it fires PLAIN rounds at TURRET_PLAIN_MULT.
const TURRET_PLAIN_MULT   = 0.7;
// The round is a glowing bolt that flies from the gun and HOMES on its target,
// so it cannot miss; the damage lands when it arrives.
const TURRET_SHOT_SPEED   = 0.3;    // tiles a frame
const TURRET_MUZZLE_Z     = 52;     // px above the floor the bolt leaves from
const TURRET_HIT_Z        = 16;     // px above the floor it strikes
let turretShots = [];
const ELECTRIC_HASTE = { 1: 1.35, 2: 1.6, 3: 1.9 };
// REPORTED: "the tier 3 effect needs to take effect near the pylons". It used
// to apply only on the strip along a link between two WAVE pylons. Now every
// lit electric pylon — turret or wave — hastes your side within this many
// tiles, at the electric network's tier (I needs 2 linked, III needs 6).
const ELECTRIC_HASTE_RADIUS = 2.5;
// SUPPORT AND DISRUPTION. A wave pylon is one or the other by its element:
// SUPPORT works on your side (electric haste, core shields), DISRUPTION works
// on the enemy (fire, ice, flux, toxic). "They only activate when there is an
// ally or an enemy nearby": one sits on STANDBY — no effect, no power draw —
// until a unit it works on comes within WAVE_WAKE_RADIUS, then blinks awake
// and runs its network's tier effect, staying up WAVE_WAKE_LINGER frames after
// the last one leaves so the edge of its reach does not flicker.
const WAVE_SUPPORT_ELEMENTS = ["electric", "core"];
const WAVE_WAKE_RADIUS = 3;
const WAVE_WAKE_LINGER = 90;
const WAVE_WAKE_BLINK  = 30;   // frames the wake-up blink lasts
function waveRole(el) { return WAVE_SUPPORT_ELEMENTS.includes(el) ? "support" : "disruption"; }
function waveRoleLabel(el) { return waveRole(el) === "support" ? "SUPPORT" : "DISRUPTION"; }
// The picker's kinds that make a wave pylon.
function isWaveKind(kind) { return kind === "wave" || kind === "support" || kind === "disruption"; }

// ── ELEMENT COMBOS ──────────────────────────────────────
// Two AWAKE support/disruption pylons of DIFFERENT elements within link range
// form a combo link, and the strip between them runs that pair's effect —
// fifteen pairs, one combo each (docs/ROADMAP-top5.md §1). Keyed by the two
// element ids in alphabetical order (comboKey). Every "every" is a multiple of
// 3, because the effects pass runs every third frame.
//   foe:  dmg (per hit, every N frames), blind (frames), stun (frames, every
//         stunEvery), pull (tiles per pass toward the link), slow (factor),
//         shred (defense factor)
//   ally: haste (factor), shield (+ per shieldEvery, up to shieldCap),
//         heal (HP per healEvery), ult (charge per pass, every 30f)
const ELEMENT_COMBOS = {
    "fire+ice":       { name: "STEAM",         foe: { blind: 90, dmg: 4, every: 30 } },
    "electric+fire":  { name: "PLASMA",        foe: { dmg: 10, every: 21 }, ally: { haste: 1.25 } },
    "fire+flux":      { name: "FIRESTORM",     foe: { pull: 0.12, dmg: 6, every: 21 } },
    "core+fire":      { name: "FORGE",         foe: { dmg: 6, every: 30 }, ally: { shield: 6, shieldEvery: 45, shieldCap: 45 } },
    "fire+toxic":     { name: "NAPALM",        foe: { dmg: 14, every: 24, shred: 0.5 } },
    "electric+ice":   { name: "CRYO-ARC",      foe: { stun: 30, stunEvery: 120 }, ally: { haste: 1.25 } },
    "electric+flux":  { name: "MAGNETAR",      foe: { pull: 0.14, dmg: 8, every: 30 } },
    "core+electric":  { name: "OVERDRIVE",     ally: { haste: 1.4, shield: 5, shieldEvery: 45, shieldCap: 40, ult: 2 } },
    "electric+toxic": { name: "CORROSIVE ARC", foe: { dmg: 8, every: 24, shred: 0.45 } },
    "flux+ice":       { name: "BLACK ICE",     foe: { pull: 0.10, slow: 0.3 } },
    "core+ice":       { name: "GLACIER WALL",  foe: { slow: 0.45 }, ally: { shield: 8, shieldEvery: 45, shieldCap: 60 } },
    "ice+toxic":      { name: "FROSTBITE",     foe: { slow: 0.5, dmg: 8, every: 30 } },
    "core+flux":      { name: "BASTION",       foe: { pull: 0.12 }, ally: { shield: 6, shieldEvery: 45, shieldCap: 50 } },
    "flux+toxic":     { name: "MIASMA",        foe: { pull: 0.10, dmg: 8, every: 24, shred: 0.5 } },
    "core+toxic":     { name: "ANTIDOTE",      foe: { shred: 0.5 }, ally: { heal: 2, healEvery: 30 } },
};
// ── OVERCHARGE (docs/ROADMAP-top5.md §2) ─────────────────
// Hold a nest you control → OVERCHARGE: every online nest in its grid gives up
// OVERCHARGE_COST of what it holds, and for OVERCHARGE_FRAMES every pylon
// drawing on that grid is SURGED — turrets fire OVERCHARGE_FIRE_MULT× as often
// on charged rounds they do not pay for, support/disruption pylons count one
// network tier higher, stay awake and draw nothing. Needs the grid at least
// OVERCHARGE_MIN_FILL full, and recharges for OVERCHARGE_COOLDOWN.
const OVERCHARGE_COST      = 0.4;
const OVERCHARGE_MIN_FILL  = 0.5;
const OVERCHARGE_FRAMES    = 480;    // 8 s
const OVERCHARGE_COOLDOWN  = 3600;   // 60 s, counted from the moment it fires
const OVERCHARGE_FIRE_MULT = 3;
// ── NIGHT SIEGE MODIFIERS (docs/ROADMAP-top5.md §3) ──────
// From SIEGE_FROM_NIGHT on, every night rolls one of these as the alarm turns
// day into night — never the same as the night before — and it lifts when the
// next wave comes. Each is read where its rule lives (siegeIs).
const SIEGES = {
    blackout: { label: "BLACKOUT",      color: "#9aa4ff", line: "Nests regenerate nothing tonight." },
    swarm:    { label: "SWARM TIDE",    color: "#c4ff5a", line: "Nymph swarms pour in \u2014 more of them, half the health." },
    hunt:     { label: "HUNTER'S MOON", color: "#ff7755", line: "Every predator hunts your pylons. They are tougher tonight." },
    storm:    { label: "STATIC STORM",  color: "#fff27a", line: "Electric everything is doubled \u2014 for both sides." },
};
const SIEGE_FROM_NIGHT   = 3;
const SIEGE_SWARM_NYMPH  = 0.7;   // share of spawns that become nymphs
const SIEGE_SWARM_HP     = 0.5;
const SIEGE_SWARM_CAP    = 2;     // extra predators per alarm zone
const SIEGE_HUNT_BASH    = 0.8;   // pylon bash damage — pylons are 25% tougher
const SIEGE_STORM_MULT   = 2;     // electric damage, and the haste bonus over 1
let siegeToday = null, siegeLast = null;
function siegeIs(id) { return siegeToday === id; }
// Static Storm doubles the BONUS of a haste: 1.35 becomes 1.7.
function stormHaste(m) { return siegeIs("storm") && m > 1 ? 1 + (m - 1) * SIEGE_STORM_MULT : m; }
function rollSiege(night) {
    if (!(night >= SIEGE_FROM_NIGHT)) { siegeToday = null; return null; }
    const ids = Object.keys(SIEGES).filter(k => k !== siegeLast);
    siegeToday = ids[Math.floor(Math.random() * ids.length)];
    return siegeToday;
}
// The night is over: remember it so tomorrow is different.
function endSiege() { if (siegeToday) siegeLast = siegeToday; siegeToday = null; }
const COMBO_MAX_LINKS = 2;        // combo links per pylon, nearest first
const COMBO_STRIP     = 1.5;      // tiles either side of the link it reaches
const COMBO_TIER_GAIN = 0.25;     // strength = 1 + this × the two networks' average tier
const COMBO_STORE_KEY = "conduit_combos";
function comboKey(a, b) { return a < b ? a + "+" + b : b + "+" + a; }
// Discovered combos persist between games: a collection to complete.
let comboDiscovered = new Set();
try {
    const raw = typeof localStorage !== "undefined" && localStorage.getItem(COMBO_STORE_KEY);
    if (raw) comboDiscovered = new Set(JSON.parse(raw));
} catch (e) { /* storage unavailable — this session only */ }
function discoverCombo(key) {
    if (!ELEMENT_COMBOS[key] || comboDiscovered.has(key)) return false;
    comboDiscovered.add(key);
    try { localStorage.setItem(COMBO_STORE_KEY, JSON.stringify([...comboDiscovered])); } catch (e) {}
    return true;
}
const ELECTRIC_HASTE_FRAMES = 12;
// PRESSURE BETWEEN ALARMS. Predators leave pylons alone, except for this share
// of them — hunters, chosen when they spawn — which, left undisturbed, walk to
// a green pylon of yours and work it over to their side (infest.js). That is
// what keeps nests, the mass-fetch rule and fire's scour job alive without
// making every wanderer a threat.
const PYLON_HUNTER_SHARE = 0.25;
// The crystal heals slowly while no alarm is up, so one bad night is not a
// permanent wound: 0.01 a frame is 0.6 a second, about eight minutes from empty.
const CRYSTAL_REGEN = 0.01;
const PYLON_AGGRO_EXPOSURE  = 45;
const PYLON_AGGRO_TRAP_RATE = 3;
// Frames between bashes once it is in reach, and the distance at which it
// gives up rather than chasing a pylon across the map.
const PYLON_BASH_COOLDOWN   = 45;
const PYLON_AGGRO_GIVE_UP   = 9;

// ── TERRITORY / CIRCUIT HARVESTING ────────────────────────
let capturedNodes = []; // { type, x, y, benefit }
let signalTowers  = []; // tile refs: { x, y, active, zoneIndex } — enemy antenna structures

let projectiles = [], fragments = [], smoke = [], shards = [];
let followerProjectiles = []; // ranged attacks from snipers/specials
let pendingPillarDestruction = [];
let respawnQueue = [];
let frame = 0, shake = 0;
let activeEmpEffect = null; // { timer, maxTimer, zone } — EMP screen-darkening flash
let lastGenX  = 0;
// Every new play begins with this many shards, to set things up with — a first
// pylon, a generator, a connector — before any are earned. "New" means no shard
// count has ever been saved, or the game was restarted.
const STARTING_SHARDS = 100;
let shardCount = 0; // loaded from localStorage on init
let activePredator = null;
let predatorRespawnTimer = 0;
let activeDayZones = 3;
let exploredZones  = new Set();

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
// exists so a predator parked by the Crystal cannot chain-kill on respawn.
const PLAYER_RESPAWN_GRACE = 90;

// ── INPUT STATE ───────────────────────────────────────────
let isPressing    = false;
let pressX = 0, pressY = 0;
let pressStartTime = 0;
let longHoldFired = false;
let touchMoved    = false;   // FIX: was missing declaration
let pointerX = 0, pointerY = 0;
let dragDX = 0, dragDY = 0;
let gesturePoints = [];

// ── ULTIMATE DOUBLE-TAP STATE ─────────────────────────────
let _ultimateLastTapActor = null;   // follower actor tapped last
let _ultimateLastTapTime  = 0;      // performance.now() of last tap

// ── PLAYER WEAPON ─────────────────────────────────────────
// Shots used to fire on any tap, which meant brushing a predator while moving
// spent a shot at it. Firing is now gated behind an explicit attack mode the
// player turns on from the radial menu, and costs ammo.
let playerAttackMode = false;
let playerAmmo       = 0;
const PLAYER_AMMO_MAX   = 60;
const PLAYER_AMMO_START = 12;
// Rounds a hacked wall panel yields. The shop used to sell ammo; with it gone
// this is the only source, so it has to be enough to keep the weapon usable.
const PANEL_AMMO_REWARD = 8;
// ── THE WALKABLE STRIP ───────────────────────────────────
// generateSegment builds rows -2..5: wall_back at -2, wall_front at 5, and
// FLOOR in between. Nothing on a team should ever stand outside that, and the
// bounds are named here because they were being written out as bare numbers in
// four places that did not agree — the player stopped at -0.5, a follower at
// -0.5 or -1.5 depending on what job it held, and the crowd-separation pass
// did not stop anywhere at all.
//
// -1 is a real floor row: it is where the nests and the wall panels are, so a
// follower sent to one has to be able to stand there. -1.5 is half a tile
// INSIDE the back wall, which is what the squad was walking into.
// The smallest distance a follower divides by when it steers off a target. At
// exactly 0 a unit standing on its target produces NaN, which is permanent.
const NPC_MIN_DIST = 0.001;
const FLOOR_Y_MIN = -1;
const FLOOR_Y_MAX = 4;
// The player stops one half-tile short of the back row. Not an accident and
// not the same number by coincidence: at y=-1 they stand level with the nest's
// own wall face, which draws over them, and the SIPHON readout goes with it.
// Followers have no such readout and do need to reach that row, which is why
// the two bounds differ.
const PLAYER_Y_MIN = -0.5;

// ── THE POWER GRID ───────────────────────────────────────
// Nests feed generators; generators feed pylons; pylons SPEND it.
//
// A nest is a battery with a life level you can watch go down, not a tap that
// runs forever. What comes out of it is finite at any moment, and the two
// abilities take it in completely different shapes:
//
//   ATTACK MODE pays PER SHOT. A turret with nothing in range costs nothing;
//               one fighting hard empties a nest fast. The shot carries the
//               energy to the target, so what you pay is what you hit with.
//   WAVE MODE   pays CONSTANTLY, for as long as it is switched on, whether or
//               not anything is near it. It is the expensive one, and the way
//               to stop paying is to switch it back to attack or cut it off
//               from the generator.
//
// The pools regenerate slowly. Without that, every nest on a five-zone map
// would eventually be flat and the game would end with nothing left to run —
// so "finite" here means a reserve you can empty and have to nurse, not one
// you can destroy for good.
const NEST_ENERGY_BASE   = 200;   // a zone-0 pool; deeper nests hold more
const NEST_ENERGY_ZONE   = 1;     // +1x capacity per zone of depth
const NEST_ENERGY_REGEN  = 0.015; // per frame → 0.9/s, per nest
// The home portal's own reserve. It is what a new game runs on before any zone
// has been taken, so it has to carry a small base on its own.
const NEST_ENERGY_HOME   = 300;
// What the abilities cost. A turret fires every 90 frames, so 2 a shot is
// ~1.3/s while it has a target and nothing at all while it does not; wave mode
// is 1.8/s forever — more than a nest regenerates, so it is a real drain, but
// slow enough to run for minutes. These used to be 4 a shot and 6/s against
// pools a third the size, which emptied a zone-1 nest in about twenty seconds
// with a single wave pylon on it.
const POWER_SHOT_COST    = 1;   // twice the rounds of old at half the price: same draw a second
const POWER_WAVE_DRAIN   = 0.03;  // per frame → 1.8/s
// A wave pylon that runs its pool dry SHUTS OFF and stays off until the pool has
// refilled to this fraction of its capacity, so it does not stutter on and off
// as regen trickles in.
const POWER_RESTART_LEVEL = 0.25;
// WAVE PYLONS SHARE A NETWORK. The first wave pylon on a pool costs the full
// POWER_WAVE_DRAIN; every further one on the SAME pool adds only this fraction
// of it, because they are one zone, not six. Six pylons cost 1 + 5 x 0.1 = 1.5
// times one, so a tier III network can actually be held instead of costing six
// times as much as the tier I pair that makes it possible.
const POWER_WAVE_SHARE = 0.1;
// When a pool cannot pay, wave pylons shut off ONE AT A TIME this many frames
// apart rather than all in the same frame, so a failing network dims through
// its tiers instead of switching off at once.
const POWER_SHED_FRAMES = 180;
// Below this a pool cannot start a shot, so a turret does not fire a round it
// has not paid for.
const POWER_MIN_RESERVE  = 0;
// How fast a turret's surge fades off its wire. A shot every 90 frames at this
// rate leaves the line lit for most of the gap between rounds, so a turret that
// is fighting reads as busy rather than as a flicker.
const POWER_FLOW_FADE    = 0.012;
let _powerPools = [];
// How far the HOME portal's reserve reaches. It feeds the generators standing
// near it and no others: it is the base's own supply, not a cable across the
// map. The same distance a generator may be placed from a nest, so any
// generator you were allowed to build beside home can always draw from it.
const HOME_POWER_REACH = GENERATOR_NEST_RANGE;
const POWER_DEAD_COLOUR = "#4a4f58";

// ── THE THREE STATES OF A NEST ───────────────────────────
// A nest's colour is the only thing that says whose it is, so the three are
// named here rather than written out at each of the places that draw one.
//
//   HOSTILE    — alive and spawning. Orange, turning, lit.
//   NEUTRAL    — its zone has been taken. Grey, still, silent, and yours to
//                claim. A zone goes neutral the moment its wave is cleared.
//   CONTROLLED — linked to one of your generator pylons. BLUE, deliberately
//                not green: green is home, and a zone you have taken is not
//                home, it is held.
const NEST_COLOUR_HOSTILE      = "#ff5522";
const NEST_COLOUR_HOSTILE_HURT = "#7a2a14";   // the same nest, badly damaged
const NEST_COLOUR_NEUTRAL      = "#6e6e78";
const NEST_COLOUR_NEUTRAL_DIM  = "#8a8a95";   // its label, which has to be read
const NEST_COLOUR_CONTROLLED   = "#3a86ff";

// ── HACKING A NEST ───────────────────────────────────────
// Standing in the patch of floor in front of a live nest hacks it, which raises
// that zone's alarm. It is PROXIMITY, not a gesture: the label used to read
// "[ HOLD to HACK NEST ]" and there is no hold anywhere in it — you walk into
// the zone and wait. The zone is drawn on the floor now instead of described.
const NEST_HACK_FRAMES = 180;   // 3s of standing there
const NEST_HACK_RANGE  = 1.5;   // tiles, measured from the tile in front of it
const NEST_HACK_SHOW   = 6;     // how close before the zone is painted at all
// A wall panel claims the siphon first — the panel loop runs before the nest
// loop and sets the same "one thing at a time" flag — so a tile in range of an
// un-hacked panel will NOT hack a nest, however close to it you stand. Named
// here because the highlight has to know, or it lights floor that does nothing.
const PANEL_SIPHON_RANGE = 1.5;
// The most hostile predators alive at once, anywhere on the map. A global
// ceiling on top of the per-zone ones, which bound WHERE predators are and not
// how many exist — see the spawn loop in js/game.js for the measurements.
// Frame cost is ~0.07ms per predator on top of a ~3ms floor, so this is the
// single number that decides how heavy a busy wave is.
const MAX_LIVE_PREDATORS = 24;

// ── CLONES ───────────────────────────────────────────────
// A clone is the same creature fighting for you, and it is meant to be a
// better one: three times the power its species has, and now three times the
// health as well. It costs shards and DNA that came from killing one, so it
// should feel like an upgrade rather than a copy.
//
// The power multiplier already existed — but only at ONE of the three places a
// clone is built. A clone that died and respawned, or one restored at the start
// of a wave, came back at ordinary predator strength. All three go through
// makeClone() in js/clone.js now.
const CLONE_POWER_MULT  = 3;
const CLONE_HEALTH_MULT = 3;
// Followers respawn in 3 seconds. A clone is worth far more than that, so
// losing one has to cost something — it comes back, slowly, and the Crystal
// shows the countdown.
const CLONE_RESPAWN_FRAMES = 1800;   // 30 seconds
// How likely a freshly generated wall panel is a DECOY that trips an alarm.
//
// Was 0.40 per panel, which measured at 28% and 5.4 decoys across the first
// four zones — and every alarm raises the wave number, so a new player farming
// panels for shards escalated themselves several waves before doing anything
// else. The opening was also far harsher than the rest of the game: after any
// alarm, resetPanels() reshuffles to exactly ONE decoy in the whole world.
// This brings the first pass in line with that, so the tension is the same
// throughout — you still never know which panel it is, there are just not five
// of them waiting in the first three zones.
const PANEL_DECOY_CHANCE = 0.08;
// What a reward panel pays, inclusive. Named because the index quoted "5-15"
// while generation had always produced 10-30 — nothing held the two together.
// What a panel pays in a zone you have already taken. A neutralised zone still
// has shards in its walls — "yes hacking for shards, but less than the normal
// amount" — so the zone stays worth walking back through without being as good
// as the fight you have not had yet.
const PANEL_NEUTRAL_SHARD_MULT = 0.4;
const PANEL_SHARD_MIN = 10;
const PANEL_SHARD_MAX = 30;
let _ATKCHIP = { x: 0, y: 0, w: 0, h: 0 };   // on-screen ammo chip, tap to disarm

// ── COMMAND / RADIAL STATE ────────────────────────────────
let commandMode = false;
let commandX = 0, commandY = 0;
// How far the ring was moved to keep it on screen (handleLongHold): it is drawn
// at commandX/Y, but a DRAG is still measured from where the finger went down.
let commandShiftX = 0, commandShiftY = 0;
let commandTarget = null;
let commandNestTarget = null;   // broken nest pod near long-press point
let commandEnemyTarget = null;  // predator under a long press, if any
let commandFollowerTarget = null;  // own follower under a long press, if any
let selectedRadialAction = null;
let commandPendingTap    = false;  // true = menu open, waiting for button tap

// ── ELEMENT PICKER (canvas-drawn) ─────────────────────────
let elementPickerOpen   = false;
let elementPickerMode   = null;   // "build" | "upgrade"
let elementPickerTarget = null;
let elementPickerStage  = "type";   // "type" (attack/wave/connector/generator) then "element"
let elementPickerKind   = null;     // the kind chosen at the first stage
let pylonConfirmKind    = null;     // ...carried to the build confirmation

// ── INFO PANEL (canvas-drawn) ─────────────────────────────
let infoPanelOpen   = false;
let infoPanelTarget = null;
let infoPanelPage   = null;   // null = target readout | 'codex' | an element id

// ── DEV / PREVIEW ─────────────────────────────────────────
let devMode = false;
let previewCanvas, previewCtx, previewPredator, sliderContainer;

// ── PREDATOR PRESETS ──────────────────────────────────────
let PREDATOR_PRESETS = {};

// ── FOLLOWER UI LAYOUT ────────────────────────────────────
const FOLLOWER_UI = { x:20, yOffset:20, width:160, rowHeight:32, padding:6 };

// ── SQUAD / BUILD / GESTURE STATE ─────────────────────────
let squadMode    = "selected"; // "all" | "selected"
let buildMode    = false;
let holdLineX    = null;       // world X boundary; null = cleared
let uiTab        = "elements"; // "elements" | "units"
let selectedRole = null;       // "brawler"|"sniper"|"camper"|null
let followerPoolMinimized = false; // whether the follower pool panel is collapsed
// The duty switch a LONG PRESS on a follower-index row opens: it puts that
// whole group — one element, or one role — on work or back on the line in a
// single instruction. null when closed.
let followerDutyMenu = null;

// ── CRYSTAL MENU / BUILDS ─────────────────────────────────
let crystalMenuOpen  = false;
let crystalMenuTab   = "modulation";   // "modulation"|"status"|"info"|"recruit"|"craft" — clones live on the HUD now
let crystalCloneSort = "species";  // "species"|"combat"|"defense"|"hp"|"specials"
// Which elements new followers may come out as. A subset of the unlocked set —
// the whole set means "any", one element means every recruit is that element.
// This replaced a 0..1 slider that indexed into a generated list of element
// combinations: with exactly two elements unlocked (fire and electric, the
// starting pair) a slider value in the TRI band fell through to the BI branch
// with a negative offset, indexed combos[-1] and crashed on combo.map.
// A set of toggles has no such arithmetic to get wrong.
let modulationMask = new Set();

// ── PLAYER ULTIMATE ───────────────────────────────
// One bar, the character's own, filled by killing and spent on an ARMY SURGE:
// every unit you own healed, its WILL refilled, its own ultimate charged, and
// harder-hitting for the duration.
//
// This is NOT the same thing as FOLLOWER_ULTIMATES in js/elements.js, which are
// per-follower, charge individually and fire on a double-tap. That system keeps
// working exactly as it did; the surge charges all of them at once.
// ── WHO PREDATORS WILL BITE ───────────────────────────────
// Predators do not attack the player. You are a saboteur moving through the
// tunnel, not a body on the line: the squad fights, and a predator that could
// simply chew on you made positioning them beside the point. Environmental
// hazards still hurt — acid pools, vent blasts, ground zones, cocoon toxin —
// because those are not predators, and dodging them is a real decision.
const PREDATORS_ATTACK_PLAYER = false;

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
// FOLLOW_STOP (2.0) and snipers hold at 4.0, so both count with slack for
// combat drift, while a camper anchored to a distant pylon and a worker off on
// a chore — neither of which follows you at all — do not.
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

// ── SETTINGS PANEL (canvas-drawn) ─────────────────────────
let settingsPanelOpen    = false;
let settingsResetConfirm = false;   // true = showing "ARE YOU SURE?" step

// ── PYLON BUILD CONFIRMATION ───────────────────────────────
let pylonConfirmOpen   = false;
let pylonConfirmEl     = null;    // element object to confirm
let pylonConfirmTarget = null;    // tile to build on

// ── CRYSTAL MODULATION ────────────────────────────────────
// Pair map: each modulator element unlocks a two-element pair
const MODULATOR_PAIRS = {
    fire:     ["fire",     "flux"],
    flux:     ["flux",     "toxic"],
    toxic:    ["toxic",    "fire"],
    electric: ["electric", "core"],
    core:     ["core",     "ice"],
    ice:      ["ice",      "electric"]
};
let ownedModulators    = [];   // [{ element }]  — collected from boss drops
let activeCrystalModulation = null; // null | { element, pair:[e1,e2] }
let groundItems        = [];   // [{ type, element, x, y }]  — world pickups

// ── HEALTH PADS ───────────────────────────────────────────
// Each pad: { charges: N }  — crafted via crystal menu, max 3 charges per pad
// Using a pad heals 30 HP and costs 1 charge; pad is removed when charges reach 0
const HEALTH_PAD_MAX_CHARGES = 3;
const HEALTH_PAD_HEAL        = 30;   // HP restored per charge
// What a pylon costs, everywhere. It was 10 in the slow build path and 40 in
// the instant one, with the radial gate and the element picker each holding
// their own copy of 40 — eight literals for one price.
const PYLON_BUILD_COST       = 10;
const HEALTH_PAD_CRAFT_COST  = 8;    // shards to craft one pad
let healthPads = [];   // [{ charges: N }]

// THE TOP BUTTONS ARE ICONS. "Make the build mode and the squad mode thing at
// the top have like a wrench and some other iconic build mode icon, kind of
// interlaced together, and with the squad button have a picture of a little
// guy, little minimalist design." BUILD is a crossed wrench and hammer; SQUAD
// is one figure on SEL and a group of three on ALL. A short tag keeps the
// state readable, and the title / aria-label still say it in words.
const ICON_BUILD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.2 8.2 L19.8 19.8" stroke-width="2.4"/><path d="M10.4 5.2 L7.8 2.6 L2.6 7.8 L5.2 10.4 Z" fill="currentColor" stroke-width="1.2"/><path d="M14.6 9.4 L4.2 19.8" stroke-width="2.4"/><path d="M16.6 3.2 A4 4 0 1 0 20.8 7.4" stroke-width="2.8"/></svg>';
const ICON_SQUAD_SEL = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="7" r="3.6"/><path d="M5 21v-2.2a7 7 0 0 1 14 0V21z"/></svg>';
const ICON_SQUAD_ALL = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><g opacity="0.55"><circle cx="5.2" cy="9" r="2.5"/><path d="M0.8 20v-1.4a4.4 4.4 0 0 1 8.8 0V20z"/><circle cx="18.8" cy="9" r="2.5"/><path d="M14.4 20v-1.4a4.4 4.4 0 0 1 8.8 0V20z"/></g><circle cx="12" cy="7.5" r="3.2"/><path d="M6.2 21v-1.8a5.8 5.8 0 0 1 11.6 0V21z"/></svg>';
function _setTopButton(btn, icon, tag, label, on) {
    if (!btn) return;
    btn.innerHTML = icon + '<span class="top-tag">' + tag + '</span>';
    btn.title = label; btn.setAttribute && btn.setAttribute("aria-label", label);
    btn.classList.toggle("active", on);
}
function updateSquadButton() {
    const all = squadMode === "all";
    _setTopButton(document.getElementById("btnSquad"), all ? ICON_SQUAD_ALL : ICON_SQUAD_SEL,
                  all ? "ALL" : "SEL", "Squad: " + (all ? "all followers" : "selected element only"), all);
}
function updateBuildButton() {
    _setTopButton(document.getElementById("btnBuild"), ICON_BUILD, buildMode ? "ON" : "OFF",
                  "Build mode: " + (buildMode ? "on" : "off"), buildMode);
}
function toggleSquad() {
    squadMode = (squadMode === "selected") ? "all" : "selected";
    updateSquadButton();
}
function toggleBuild() {
    buildMode = !buildMode;
    updateBuildButton();
}
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
