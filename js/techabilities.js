// ─────────────────────────────────────────────────────────
//  THE TECHNICIANS' ABILITIES (the Level 1 update): one table, one way in (docs/TECHNICIANS.md)
// ─────────────────────────────────────────────────────────
// ASKED: "Implement the complete Level 1 update for my existing Conduit game [...] all six Technician types and their Level 1 abilities [...] The HUD must use the same underlying ability logic as world interactions."
// A TECHNICIAN (role "camper", shown as TECHNICIAN) of an element has that element's ability, as an egg and evolved alike. Every way of using one goes through techAbilityUse: the chip on its card in the squad (js/party.js),
// a tap in the world, the tests. So a command from the HUD and one from the world are one thing, with one cooldown and the same checks, and only a technician that is in the squad uses one.
//   WAITS: the first use waits TECH_AB.joinWait after the technician joins the squad (the user: "the 60-second initial squad wait"), and each use after that waits that ability's cooldown (60 s for each of the six, as asked).
//     Cooldowns are not saved (none are).
//   THE SIX: ELECTRIC the KINETIC LAUNCHER, CORE the PHOTONIC SHIELD, FIRE the THERMITE DRILL, ICE the FROST PATCH, TOXIC the TOXIC PODS (the Blight Spider's pools until build 2026-11-06k), FLUX FLUX MOVE (each below; FLUX MOVE's rules: js/fluxmove.js). docs/TECHNICIANS.md
//     has their numbers, which were given and which are provisional, and what is still to be decided. (The flux technician's TELEGRAB is retired: the owner, 2026-11-06, "Retire it now"; docs/FLUX-MOVEMENT.md.)
//   THE SEVENTH (build 2026-11-08m): BLOOM the coral crab's REEF: an outcrop of rock and crystal in a fight, a climb up onto high ground outside one (below; docs/CONVERSION.md §2).
//   AIMS: what a chip asks the player to pick, in order: a follower, an enemy (on the screen, or its card), a spot on the floor, an object and then its new place (FLUX MOVE), a path (FAULTLINE).
//
// THE KINETIC LAUNCHER. ASKED: "Combat Mode — Launch a Follower at an Enemy [...] Secret Access Mode — Launch Toward Hidden Areas [...] The first designated secret destination is the Arena Catwalk [...] the broken section permits travel
// from top to bottom, not from bottom to top", then "the kinetic launcher should do a set amount of damage to the follower, but a more proportionate damage to the enemy. It should also have the map exploration mode as a secondary feature
// that is permanent, and you need to have some sort of check for a spot where it can be deployed. And whenever you enter a spot where it can be deployed, have a little notification or highlighted area near the catwalk, or in the future
// any sort of secret area, and have it be clickable, and the player can engage with the electric technician, and he can set up the kinetic launcher."
//   COMBAT: the chip on an electric technician's squad card, then a follower to throw, then an enemy the technician can see. The follower runs to the technician and is thrown in an arc at the enemy: the enemy takes
//     TECH_AB.launch.powerMult times the thrown follower's power (its element counts, as on every hit), the follower takes the set TECH_AB.launch.selfDamage (no hit takes more than a third of a follower's health at once:
//     js/helpers.js applyDamage), and it comes down beside the enemy and fights it. A throw that hits gives the technician the XP a kill of that enemy would, once. The cooldown starts when the follower leaves the ground, so a throw
//     called off (the enemy died, the follower could not get to the technician in TECH_AB.launch.loadWait) costs nothing.
//   EXPLORATION: a LAUNCHER SITE (the map's `launchSites`, js/facilitymap.js) shows only when you are near it: a highlighted patch on the floor, a label, and a notice as you come near. Tap it and an electric technician in your squad walks
//     over and sets a launcher up there FOR GOOD (it is saved, and the setting up gives its XP once). Tap the launcher: the arc it throws on is drawn, to where a follower comes down; tap a follower and it runs to the launcher and is thrown
//     up into the site's room (the Arena Catwalk), where it holds the room until it is called back (COME). The way down is the room's LEDGE (the map's `ledges`; build 2026-11-07qq, the owner: "a ledge that goes down that the
//     player can only move to jump off of to get down", in place of the site's old broken section): a follower that is not holding the room walks onto it and jumps down to the floor under it, one way only. Nobody walks up: the
//     catwalks stay shut to walking (tests/facility.js); the launcher is the only way up, and at the catwalks only a follower goes (and Side Quest, who flies: js/sidequest.js).
//   THE RIDE (2026-10-31, the Sewers' collapsed tunnel: docs/SEWER-QUEST.md): a site with `rider` has its launcher carry YOU as well. Tap its tag once for the aim and again to ride it: you walk to the pad and are thrown up the
//     same arc a follower flies (in the air nothing else moves you and no wall or solid stops you: js/facilityplay.js facilityPlayerStep draws on techFlightStep), and you land on the site's landing. The way back is the site's
//     the floor's LEDGE, if it has one (walk onto it, or tap its tag ▼ LEDGE: one way, to the floor under it). A follower sent up there waits for you (a POCKET site: _pocketHold) and, once you are not up there with it, jumps after you.

// THE NUMBERS. PROVISIONAL marks a number that was not given and waits to be confirmed (docs/TECHNICIANS.md); the rest are how it looks and feels.
const TECH_AB = {
    joinWait: 3600,   // 60 s: the first wait after a technician joins the squad (the user's "60-second initial squad wait")
    launch: {
        cooldown: 3600,     // PROVISIONAL: 60 s after a throw (as long as the first wait)
        selfDamage: 10,     // PROVISIONAL: the set amount the thrown follower takes
        powerMult: 3,       // PROVISIONAL: the enemy takes this many times the thrown follower's power
        siteXp: 100,        // PROVISIONAL: the XP for setting a launcher up (it was a level-5 scout's kill; kills pay double now, js/levels.js XP_YIELD, and this was not asked to)
        hitReach: 1.6,      // tiles: an enemy this near where the follower comes down is hit (it may have moved while the follower flew)
        loadReach: 1.3,     // tiles: how near the technician (or the launcher) the follower comes to be thrown
        loadWait: 480,      // frames to get there, or the throw is called off
        flight: 40, peak: 70,            // frames in the air, and the arc's height (px), at an enemy
        siteFlight: 64, sitePeak: 120,   // and up into a site's room
        dropFlight: 28,                  // frames to fall through a broken section
        near: 6,            // tiles: how near a site the player is when it shows
        setupWalk: 1200,    // frames the technician has to get to the site
        setup: 120,         // frames it works there
    },
    shield: {
        cooldown: 3600,     // 60 s after it goes up (the user: 60 s for each of the six)
        life: 1200,         // exactly 20 s, then it is gone (given)
        width: 3,           // tiles across (the user: "3 wide, 3 back")
        back: 3,            // tiles: how far behind it the core technician holds
        gap: 0.9,           // tiles: how far in front of a creature nearer than that it goes up
        band: 0.4,          // tiles: how near its line a creature's body comes, and how far past its ends it still stops one
        leash: 10,          // tiles: the technician stops holding when you are this far from it, and comes with you
    },
    drill: {
        cooldown: 3600,     // 60 s from its first hit
        hits: 6,            // hits to drill the rubble through (given)
        every: 60,          // frames between hits: one a second (given)
        rocks: 3,           // the rocks the rubble leaves, once (given)
        foeHits: 3,         // hits on an enemy (given)
        foeMult: 2,         // each this many times its normal hit (given): followerAttack's plain hit, a quarter of its attack
        reach: 1.0,         // tiles: how near an enemy it drills from
        walk: 1200,         // frames to get to the rubble, or it is called off (as long as a launcher's set-up)
        foeWait: 480,       // frames to get to the enemy (or to catch it up again), or it is called off
        near: 6,            // tiles: how near the rubble you are when its label shows
    },
    frost: {
        cooldown: 3600,     // 60 s
        size: 3,            // tiles: 3 by 3 (given)
        life: 600,          // 10 s (given)
        slow: 0.5,          // enemies on it move at half speed (given)
        boost: 1.5,         // PROVISIONAL: your units on it move this much faster ("they cross faster": how much faster was not given)
        // ICE BRIDGES: the same chip aimed at water (the owner, 2026-11-06: "One ability"; "Straight, 30 s": straight, 2 tiles wide, bank to bank, up to 8 tiles; one 60 s wait for patch or bridge)
        bridgeWide: 2,      // tiles across
        bridgeMax: 8,       // tiles of water at most, bank to bank
        // (a bridge stands until the same technician makes its next one: the owner, 2026-11-07, "Until the next one"; it was 30 s)
    },
    blight: {
        cooldown: 3600,     // 60 s from when its pool is down
        size: 2,            // tiles: 2 by 2 (given)
        max: 3,             // pools at once: a 4th takes the oldest's place (given)
        life: 7200,         // frames of play: a TOXIC POD runs down in 2 minutes of play (the owner, 2026-11-06: "Shorter life"; the pools it replaced lasted 2 in-game days), its field weaker and smaller as it goes
        every: 30,          // frames between its bites at what stands in it: every half second (given)
        walk: 1200,         // frames to get to the spot, or it is called off
    },
    flux: {
        cooldown: 3600,     // 60 s from when the object is placed (the owner: "60 s cooldown", as every technician ability); the reach is each object's own (js/facilitymap.js `flux`, 2 tiles)
    },
    // REEF (BLOOM's, the coral crab's; build 2026-11-08m): the owner, 2026-11-08, on its fight numbers: "You pick, provisional"
    reef: {
        cooldown: 3600,     // 60 s for an outcrop or a climb (designed: "the usual 60-second wait")
        life: 1200,         // 20 s: an outcrop (designed)
        radius: 0.8,        // PROVISIONAL: tiles: an outcrop's body (enemies are held outside it)
        body: 0.3,          // tiles: how near its edge a creature's middle comes
        mend: 0.01,         // PROVISIONAL: the share of its maximum health a follower beside it is mended each beat (SEEDFALL's)
        every: 30,          // PROVISIONAL: frames between beats: every half second
        mendReach: 1.5,     // PROVISIONAL: tiles past its edge a follower is "beside it"
        shards: 16,         // frames its shards fly before the rock and crystal grow
        rise: 1,            // tiles of height, at least, between the two floors of a climb
        search: 6,          // tiles: how far from the tap the edge of the high ground may be
        foot: 3,            // tiles out from the low floor's edge the climb's foot is, where the camera sees it (the catwalks' ledge lands as far out); nearer where the floor stops
        flight: 40, peak: 26,   // frames over a climb, and the arc's height (px)
    },
    // REEF PILLAR (the coral crab's Ultimate: the owner's design, 2026-11-08: "Blocks and heals only"): every number PROVISIONAL, the agent's
    pillar: {
        reach: 7,           // tiles: the nearest enemy it can see within this is its target
        gap: 1.2,           // tiles in front of the target (on the crab's side) the spike erupts; at half way for a target nearer than twice this
        life: 600,          // 10 s
        core: 0.9,          // tiles: the giant spike's body
        flank: 0.6,         // tiles: each lesser spike's body, one either side of it across the line, so the three stand like a wall
        spread: 1.1,        // tiles from the giant spike to each lesser one
        mend: 0.02,         // a share of its maximum health each beat, to each of your followers near it
        every: 30,          // frames between beats
        mendReach: 2,       // tiles past a spike's edge a follower is "near it"
    },
    // FAULTLINE (the evolved Thermite Burrower's second ability; the follower combat redesign, docs/FOLLOWER-COMBAT-REDESIGN.md §2.4): every number PROVISIONAL (§11.2)
    fault: {
        cooldown: 3600,     // 60 s, its own (the drill keeps its own wait)
        maxLen: 8,          // tiles: the longest path; the stroke stops growing there
        minLen: 1,          // tiles: a shorter stroke sends nothing (and the aim stays up)
        step: 0.25,         // tiles between the path's points, once it is smoothed
        spacing: 0.75,      // tiles between the spikes along it
        hitR: 0.7,          // tiles: how near a spike an enemy is hit
        speed: 0.12,        // tiles a frame under the floor (BURROW STRIKE's)
        mult: 2,            // × its plain hit, each spike (the plain hit is a quarter of its ATK)
        dive: 20,           // frames to dive (BURROW STRIKE's)
        trace: 90,          // frames the path still glows after it has surfaced
    },
    day: 72000,             // THE PLAY CLOCK: frames of play to an in-game day, 20 minutes (given); it runs only while the game does (it is saved, and nothing passes while the game is closed)
};

// The ability of each element's technician: its name, the word and the mark on its chip, what the player picks for it (in order), what the prompt asks for each pick, and what it does with them.
const TECH_ABILITIES = {
    electric: { id: "kinetic_launcher", name: "KINETIC LAUNCHER", short: "LAUNCH", icon: "⚡", col: "#ffe733", aim: ["follower", "enemy"], use: (f, p) => techLaunchAt(f, p.follower, p.enemy),
                ask: (need, p) => need === "follower" ? "TAP A FOLLOWER TO THROW" : "TAP AN ENEMY TO THROW " + _techName(p.follower) + " AT" },
    core:     { id: "photonic_shield", name: "PHOTONIC SHIELD", short: "SHIELD", icon: "◈", col: "#5ff7e0", aim: ["enemy"], use: (f, p) => techShieldAt(f, p.enemy),
                ask: () => "TAP THE CREATURE (OR ITS CARD) TO SHIELD AGAINST" },
    fire:     { id: "thermite_drill", name: "THERMITE DRILL", short: "DRILL", icon: "✹", col: "#ff8a3a", aim: ["enemy"], use: (f, p) => p.rubble ? _techDrillRubble(f, p.rubble) : techDrillFoe(f, p.enemy),
                ask: () => "TAP AN ENEMY IT CAN SEE (OR ITS CARD) TO DRILL" },
    ice:      { id: "frost_patch", name: "FROST PATCH", short: "FROST", icon: "❄", col: "#9be8ff", aim: ["spot"], use: (f, p) => techFrostAt(f, p.spot),
                ask: () => "TAP FLOOR FOR A PATCH, OR WATER FOR A BRIDGE, WHERE IT CAN SEE" },
    toxic:    { id: "blight_spider", name: "TOXIC PODS", short: "POD", icon: "☣", col: "#7dff4a", aim: ["spot"], use: (f, p) => techBlightAt(f, p.spot),
                ask: () => "TAP THE FLOOR WHERE IT CAN SEE: IT SETS A TOXIC POD THERE" },
    flux:     { id: "flux_move", name: "FLUX MOVE", short: "MOVE", icon: "✦", col: "#c77dff", aim: ["object", "place"], use: (f, p) => techFluxMoveAt(f, p.object, p.place),
                ask: () => "" },   // (its prompt says more as it goes: techAimPrompt)
    blossom:  { id: "reef", name: "REEF", short: "REEF", icon: "◆", col: "#ff7ab8", aim: ["spot"], use: (f, p) => techReefAt(f, p.spot),
                ask: () => "TAP THE FLOOR FOR AN OUTCROP, OR HIGH GROUND TO CLIMB, WHERE IT CAN SEE" },   // (BLOOM's: the coral crab's, as an egg and evolved alike)
};
// A SECOND ABILITY, by form (the owner, 2026-11-02, "Keep both buttons"): the evolved THERMITE BURROWER keeps its element's THERMITE DRILL and has FAULTLINE beside it, on a chip of its own with a
// wait of its own (`_ab2ReadyAt`). An egg, and every other form, has the one ability above. Its aim is a PATH drawn on the floor (techAimPathStart / Move / End, from js/input.js).
const TECH_ABILITY2 = {
    thermite: { id: "faultline", name: "FAULTLINE", short: "FAULT", icon: "〰", col: "#ff6a1f", ult: true, aim: ["path"], use: (f, p) => techFaultlineAt(f, p.path),
                ask: () => "PRESS ON THE FLOOR, DRAW ITS PATH AND LET GO" },
};

function _techFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _techSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 96, text, color: col || "#ffe733", life: 110, vy: -0.22, size: 13 }); }
function _techName(f) { return typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER"; }
function _techMember(f) { return typeof partyIsMember === "function" ? partyIsMember(f) : !!f && !f.dead; }

// ── who has which ability, and when it can be used ──
function techAbilityOf(f) { return f && f.isFollower && !f.isClone && f.role === "camper" ? TECH_ABILITIES[f.element] || null : null; }
function techAbility2Of(f) { return f && f.isFollower && !f.isClone && f.role === "camper" && f.evolved && TECH_ABILITY2[f.evolved] ? TECH_ABILITY2[f.evolved] : null; }   // (the evolved Thermite Burrower's FAULTLINE)
function techReady2In(f) { return Math.max(0, ((f && f._ab2ReadyAt) || 0) - _techFrame()); }
function techReadyIn(f) { return Math.max(0, ((f && f._abReadyAt) || 0) - _techFrame()); }   // frames until it can use its ability again
// a technician's cooldown after its equip cards (js/cards.js EQUIP_STATS.cooldown: the share the cards it wears take off it, added over them; never more than nine tenths off). Every place a cooldown is set goes through here.
// With DOUBLE CHARGE (js/cards.js, a Series 2 card) and its second charge held, that charge is spent instead of the wait: the ability is ready again at once (equipChargeSpend), and the charge comes back one cooldown later.
function techCooldown(f, base) {
    const b = typeof equipBonus === "function" ? equipBonus(f, "cooldown") : 0, cd = Math.max(1, Math.round(base * (1 - Math.min(0.9, Math.max(0, b || 0)))));
    return typeof equipChargeSpend === "function" && equipChargeSpend(f, cd) ? 1 : cd;
}
function techAbilityCan(f) {
    const ab = techAbilityOf(f); if (!ab) return { ok: false, why: "NO ABILITY" };
    if (f.dead || f.returningToCrystal || f._flight) return { ok: false, why: "NOT HERE" };
    if (!_techMember(f)) return { ok: false, why: "NOT IN THE SQUAD" };
    if (f._abBusy || f._burrow) return { ok: false, why: "BUSY" };   // (_burrow: the Thermite Burrower's BURROW STRIKE under way, js/combat.js)
    const w = techReadyIn(f); if (w > 0) return { ok: false, why: ab.short + " READY IN " + Math.ceil(w / 60) + " S" };
    return { ok: true, ab };
}
// THE ONE WAY IN (the HUD's chip, the world, the tests): { ok } or { ok: false, why }
function techAbilityUse(f, picks) {
    const c = techAbilityCan(f); if (!c.ok) return c;
    return c.ab.use(f, picks || {});
}
// the second ability's, as the first's: in the squad, not busy (a drill, a FAULTLINE, BURROW STRIKE under way) and ready; its own wait
function techAbility2Can(f) {
    const ab = techAbility2Of(f); if (!ab) return { ok: false, why: "NO ABILITY" };
    if (f.dead || f.returningToCrystal || f._flight) return { ok: false, why: "NOT HERE" };
    if (!_techMember(f)) return { ok: false, why: "NOT IN THE SQUAD" };
    if (f._abBusy || f._fault || f._burrow) return { ok: false, why: "BUSY" };
    if (ab.ult) { if (!(f.ultimateCharge >= 100)) return { ok: false, why: ab.name + " · ITS ULTIMATE IS NOT CHARGED" }; }   // (FAULTLINE is the Thermite Burrower's Ultimate: the owner, "Make it the Ultimate")
    else { const w = techReady2In(f); if (w > 0) return { ok: false, why: ab.short + " READY IN " + Math.ceil(w / 60) + " S" }; }
    return { ok: true, ab };
}
function techAbility2Use(f, picks) {
    const c = techAbility2Can(f); if (!c.ok) return c;
    return c.ab.use(f, picks || {});
}

// ── the sites (the map's launchSites) and the launchers set up at them ──
function _techSites() { return (typeof _fp !== "undefined" && _fp && _fp.F && _fp.F.launchSites) || []; }
function _techSite(id) { return _techSites().find(s => s.id === id) || null; }
// THE LEDGES (js/facilitymap.js `ledges`, build 2026-11-07qq): the one way down from a raised floor (the catwalks'): stepped off at `at`, landed on at `to`
function _techLedges() { return (typeof _fp !== "undefined" && _fp && _fp.F && _fp.F.ledges) || []; }
function _techLedge(id) { return _techLedges().find(l => l.id === id) || null; }
// which way a ledge looks out (a step along x or y, from its tile toward where you land)
function _techLedgeDir(L) { const dx = L.to[0] - L.at[0], dy = L.to[1] - L.at[1]; return Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]; }
// the ledge down from the stretch of floor (x, y) is on, if it has one and the floor under it is still another stretch
function _techLedgeFrom(x, y) { const c = _techComp(x, y); if (c === undefined) return null; for (const l of _techLedges()) if (_techComp(l.at[0], l.at[1]) === c && _techComp(l.to[0], l.to[1]) !== c) return l; return null; }
function _techInstalled() { if (!_fp.launchers) _fp.launchers = new Set(); return _fp.launchers; }
function techLauncherAt(id) { return typeof _fp !== "undefined" && !!_fp && _techInstalled().has(id); }
function techLaunchersSnapshot() { return typeof _fp !== "undefined" && _fp ? Array.from(_techInstalled()) : []; }
function techLaunchersApply(list) { if (typeof _fp === "undefined" || !_fp) return; const S = _techInstalled(); S.clear(); for (const id of (Array.isArray(list) ? list : [])) if (_techSite(id)) S.add(id); }
function _techComp(x, y) { return typeof _pComp === "function" ? _pComp(x, y) : undefined; }   // which stretch of floor a point is on (js/facilityportals.js)
function _techSiteBusy(s) {
    const p = _techRider();
    if (p && ((p._launchLoad && p._launchLoad.site === s.id) || (p._flight && p._flight.site === s.id && p._flight.kind === "site"))) return true;   // (you, on your way to its pad or in its arc)
    return typeof followers !== "undefined" && followers.some(a => a && !a.dead && ((a._launchLoad && a._launchLoad.site === s.id) || (a._flight && a._flight.site === s.id && a._flight.kind === "site")));
}
function _techSettingUp(s) { return typeof followers !== "undefined" && followers.some(a => a && !a.dead && a._siteWork && a._siteWork.site === s.id); }

// ── COMBAT: throw a follower at an enemy ──
function _techThrowable(g, by) { return !!g && !g.dead && g.isFollower === true && !g.isClone && g.team === "green" && g !== by && !g._flight && !g._launchLoad && !g._siteWork && !g.returningToCrystal; }
function _techFoeOk(foe) { return !!foe && !foe.dead && foe.team !== "green" && !foe.isClone && !(typeof isHostileTarget === "function" && !isHostileTarget(foe)); }
function techLaunchAt(tech, who, foe) {
    if (!_techThrowable(who, tech)) return { ok: false, why: who === tech ? "IT CANNOT THROW ITSELF" : "PICK A FOLLOWER TO THROW" };
    if (!_techFoeOk(foe)) return { ok: false, why: "PICK AN ENEMY" };
    if (typeof facilitySeesFrom === "function" && !facilitySeesFrom(tech.x, tech.y, foe.x, foe.y)) return { ok: false, why: "THE TECHNICIAN CANNOT SEE IT" };   // (thrown only at what it sees: never over a wall into another room; over a low object, yes)
    tech._abBusy = { kind: "combat", who };
    who._launchLoad = { kind: "combat", by: tech, foe, t0: _techFrame() }; who.job = null; who.attackOrder = null;
    _techSay("⚡ " + _techName(who) + " TO THE LAUNCHER", "#ffe733");
    return { ok: true };
}

// ── EXPLORATION: set a launcher up at a site; send a follower up from it ──
function techSiteSetup(s) {
    if (!s) return { ok: false, why: "NO SITE" };
    if (techLauncherAt(s.id)) return { ok: false, why: "A LAUNCHER IS ALREADY HERE" };
    if (_techSettingUp(s)) return { ok: false, why: "IT IS BEING SET UP" };
    const tech = (typeof partyMembers === "function" ? partyMembers() : []).find(f => { const ab = techAbilityOf(f); return ab && ab.id === "kinetic_launcher" && !f._abBusy && !f._flight; });
    if (!tech) return { ok: false, why: "SETTING IT UP NEEDS AN ELECTRIC TECHNICIAN IN YOUR SQUAD" };
    tech._abBusy = { kind: "setup", site: s.id }; tech._siteWork = { site: s.id, t0: _techFrame(), workAt: null }; tech.job = null; tech.attackOrder = null;
    return { ok: true, tech };
}
// the technician a pocket site is for (its `only` ability): "A FIRE TECHNICIAN"
function _techOnlyName(s) { const el = s && s.only ? Object.keys(TECH_ABILITIES).find(k => TECH_ABILITIES[k].id === s.only) : null; return el ? "A " + el.toUpperCase() + " TECHNICIAN" : "A FOLLOWER"; }
function techSiteLaunch(s, who) {
    if (!s || !techLauncherAt(s.id)) return { ok: false, why: "NO LAUNCHER HERE YET" };
    if (_techSiteBusy(s)) return { ok: false, why: "THE LAUNCHER IS IN USE" };
    if (!_techThrowable(who, null)) return { ok: false, why: "PICK " + _techOnlyName(s) + " TO SEND " + (s.pocket ? "IN" : "UP") };
    if (s.only && !(techAbilityOf(who) && techAbilityOf(who).id === s.only)) return { ok: false, why: "ONLY " + _techOnlyName(s) + " GOES IN THERE · PICK ONE" };   // (a pocket is for the ability that opens it: anyone else would be shut in)
    if (_techComp(who.x, who.y) === _techComp(s.land[0], s.land[1])) return { ok: false, why: s.pocket ? "IT IS IN THERE ALREADY" : "IT IS UP THERE ALREADY" };
    if (!s.pocket && typeof partyRoomFree === "function" && !partyRoomFree(s.to)) return { ok: false, why: "THE " + String(s.label || s.to).toUpperCase() + " IS FULL · " + partyRoomCap(s.to) + " OF " + partyRoomCap(s.to) };   // (a room's cap: js/party.js; a pocket is no post)
    who._launchLoad = { kind: "site", site: s.id, t0: _techFrame() }; who.job = null; who.attackOrder = null;
    _techSay("⚡ " + _techName(who) + " TO THE LAUNCHER", "#ffe733");
    return { ok: true };
}

// ── THE RIDE: a launcher at a site with `rider` carries the player too (the Sewers' collapsed tunnel, docs/SEWER-QUEST.md) ──
// techSiteRide: you walk to the pad (facilityWalkTo; a tap elsewhere calls it off, as it does a walk to a station) and _techRiderTick throws you when you are within loadReach of it: the same flight as a follower's, to the
// site's landing. techLedgeJump: up on a raised floor with a LEDGE you walk onto it and jump down to the floor under it, one way (walking onto it does it too). Both refuse, and say why, when they cannot. Nothing of this is saved: a game left in
// the air comes back on the floor (js/facilitysave.js puts you where you stood if that is floor, else at the Crystal).
function _techRider() { return typeof player !== "undefined" && player && typeof player.x === "number" ? player : null; }
function _techRiderBusy(p) { return !!(p._flight || (typeof facilityPortalBusy === "function" && facilityPortalBusy())); }
function techSiteRide(s) {
    const p = _techRider(); if (!p) return { ok: false, why: "NOBODY TO RIDE" };
    if (!s) return { ok: false, why: "NO SITE" };
    if (!s.rider) return { ok: false, why: "IT THROWS FOLLOWERS ONLY" };   // (the Arena Catwalk: nobody walks it, and you do not go up; said first, whatever stands there)
    if (!techLauncherAt(s.id)) return { ok: false, why: "NO LAUNCHER HERE YET" };
    if (_techRiderBusy(p)) return { ok: false, why: "NOT NOW" };
    if (_techSiteBusy(s)) return { ok: false, why: "THE LAUNCHER IS IN USE" };
    if (_techComp(p.x, p.y) === _techComp(s.land[0], s.land[1])) return { ok: false, why: "YOU ARE UP THERE ALREADY" };
    if (Math.hypot(s.at[0] - p.x, s.at[1] - p.y) > TECH_AB.launch.loadReach && !(typeof facilityWalkTo === "function" && facilityWalkTo(s.at[0], s.at[1]))) return { ok: false, why: "NO WAY TO THE LAUNCHER FROM HERE" };
    p._dropSite = null; p._launchLoad = { kind: "site", site: s.id, t0: _techFrame() };   // (set after the walk: a new destination clears it, js/facilityplay.js facilityWalkTo)
    _techSay("⚡ TO THE LAUNCHER · IT THROWS YOU OVER", "#ffe733");
    return { ok: true };
}
// you, up on a raised floor: walk to its LEDGE and jump down from it (a tap on the ledge's tag; walking onto it does the same: _techRiderTick)
function techLedgeJump(L) {
    const p = _techRider(); if (!p) return { ok: false, why: "NOBODY TO JUMP" };
    if (!L) return { ok: false, why: "NO LEDGE HERE" };
    if (_techRiderBusy(p)) return { ok: false, why: "NOT NOW" };
    if (_techComp(p.x, p.y) !== _techComp(L.at[0], L.at[1])) return { ok: false, why: "YOU ARE NOT UP THERE" };
    if (_techComp(L.at[0], L.at[1]) === _techComp(L.to[0], L.to[1])) return { ok: false, why: "THE WAY DOWN IS OPEN · WALK" };
    if (Math.hypot(L.at[0] - p.x, L.at[1] - p.y) > 0.5 && !(typeof facilityWalkTo === "function" && facilityWalkTo(L.at[0], L.at[1]))) return { ok: false, why: "NO WAY TO THE LEDGE FROM HERE" };
    p._launchLoad = null; p._dropSite = L.id; p._dropT0 = _techFrame();
    _techSay("▼ TO THE LEDGE · YOU JUMP DOWN FROM IT", "#ffe733");
    return { ok: true };
}
// each frame: you on your way to a launcher's pad, or to a ledge; at it, the flight (a ledge you walk onto takes you down too: "the player can only move to jump off of to get down")
function _techRiderTick(f0) {
    const p = _techRider(); if (!p) return;
    const T = TECH_AB.launch, fx = () => { if (typeof elementEffects !== "undefined") elementEffects.push({ type: "ring", x: p.x, y: p.y, radius: 0.9, color: "#ffe733", life: 22 }); };
    const L = p._launchLoad;
    if (L && !p._flight) {
        const s = _techSite(L.site);
        if (!s || !techLauncherAt(s.id)) { p._launchLoad = null; _techSay("THE RIDE IS OFF", "#ff8a6a"); }
        else if (f0 - L.t0 > T.loadWait) { p._launchLoad = null; _techSay("THE RIDE IS OFF · YOU DID NOT GET TO THE LAUNCHER", "#ff8a6a"); }
        else if (Math.hypot(s.at[0] - p.x, s.at[1] - p.y) <= T.loadReach) { p._launchLoad = null; _techFly(p, s.land[0], s.land[1], T.siteFlight, T.sitePeak, { kind: "site", site: s.id, rider: true }); fx(); }
    }
    if (!p._flight && !_techRiderBusy(p)) {
        const L = p._dropSite ? _techLedge(p._dropSite) : _techLedgeFrom(p.x, p.y);
        if (p._dropSite && !L) p._dropSite = null;
        else if (p._dropSite && f0 - (p._dropT0 || 0) > T.loadWait) { p._dropSite = null; _techSay("THE JUMP IS OFF · YOU DID NOT GET TO THE LEDGE", "#ff8a6a"); }
        else if (L && (p._dropSite || !p._climbHold) && Math.hypot(L.at[0] - p.x, L.at[1] - p.y) <= 0.5 && _techComp(L.at[0], L.at[1]) !== _techComp(L.to[0], L.to[1])) { p._dropSite = null; p.fpPath = null; _techFly(p, L.to[0], L.to[1], T.dropFlight, 14, { kind: "drop", ledge: L.id, rider: true }); fx(); }   // (not the moment a climb has set you down on it: step off it first)
    }
    // REEF's CLIMBS (both ways): a walk that ends on a climb's end, or a tap on its tag, takes you over it to its other end. Set down there, you step off it before it takes you again (_climbHold).
    if (!p._flight && !_techRiderBusy(p) && (techClimbs.length || p._climbGo || p._climbHold)) {
        if (p._climbGo && !_techClimb(p._climbGo)) p._climbGo = null;
        else if (p._climbGo && f0 - (p._climbT0 || 0) > T.loadWait) { p._climbGo = null; _techSay("THE CLIMB IS OFF · YOU DID NOT GET TO IT", "#ff8a6a"); }
        let near = false;
        for (const C of techClimbs) {
            const E = _techClimbEnd(C, p.x, p.y); if (!E) continue;
            const d = Math.hypot(E.at[0] - p.x, E.at[1] - p.y); if (d <= 0.9) near = true;
            if (d > 0.5) continue;
            const asked = p._climbGo === C.id, walked = !p._climbHold && Math.hypot(p.targetX - E.at[0], p.targetY - E.at[1]) <= 0.75;
            if (!asked && !walked) continue;
            p._climbGo = null; p.fpPath = null; _techFly(p, E.to[0], E.to[1], TECH_AB.reef.flight, TECH_AB.reef.peak, { kind: "climb", climb: C.id, up: E.up, rider: true });
            if (typeof elementEffects !== "undefined") elementEffects.push({ type: "ring", x: p.x, y: p.y, radius: 0.8, color: "#ff7ab8", life: 20 });
            near = true; break;
        }
        if (!near) p._climbHold = false;   // (off every climb's end: the next walk onto one takes you over)
    }
}

// ── THE PHOTONIC SHIELD (core) ──
// ASKED: "The Core Technician deploys a photonic shield between itself and the player-selected creature, creating a defensive barrier that blocks enemy movement while allowing friendly units to pass through and fire through it [...]
// The shield lasts exactly 20 seconds after activation, then disappears automatically [...] Do not invent additional damage or durability mechanics"; then "3 wide, 3 back" (a 3-tile wall; the core technician holds about 3 tiles
// behind it) and "Block attacks too" (enemies cannot hit anything on the far side either).
//   PLACING: on the line from the technician to the creature, `back` tiles in front of the technician; a creature nearer than that has it go up `gap` in front of it, and the technician steps back to hold `back` behind it. Across
//     the line it reaches `width` / 2 either way, as far as the floor goes (a wall ends it). A creature caught on its line is put out on its own side.
//   WHAT IT STOPS: a creature (an enemy: isEnemyUnit) cannot step, be knocked, pulled or leap across it, nor bite, spit or use a special at anything on the other side (the line from it to its target crosses the shield). Your
//     followers, clones and you walk through it, and your shots and blows go through. It has no health: nothing breaks it; it is simply gone after `life`.
//   THE TECHNICIAN holds its spot behind the shield (it fights back only what comes up to it) until the shield is gone, it is given an order (COME, RETREAT, an attack), it leaves the squad, or you go `leash` tiles away.
let techShields = [];   // the shields that are up: { id, by, x, y, nx, ny (the line's normal, from the technician's side), u0, u1 (its ends along the line), t0, until, hits }
let _techShieldN = 0;
function _techStops(a) { return !!a && !a.dead && (typeof isEnemyUnit === "function" ? isEnemyUnit(a) : a.team !== "green" && !a.isClone); }
// where it goes: its middle, its normal, how far it reaches either way, and where the technician holds
function _techShieldPlace(tech, foe) {
    const S = TECH_AB.shield, dx = foe.x - tech.x, dy = foe.y - tech.y, D = Math.hypot(dx, dy) || 1e-6, nx = dx / D, ny = dy / D;
    const los = (x0, y0, x1, y1) => typeof facilityLosFrom !== "function" || facilityLosFrom(x0, y0, x1, y1);
    const stand = (x, y) => typeof facilityStandOk !== "function" || facilityStandOk(x, y);
    let cx, cy, hx = tech.x, hy = tech.y;
    if (D >= S.back + S.gap) { cx = tech.x + nx * S.back; cy = tech.y + ny * S.back; }
    else {
        const k = Math.max(D * 0.5, D - S.gap); cx = tech.x + nx * k; cy = tech.y + ny * k;   // just in front of the creature
        for (let b = S.back; b >= 0.5; b -= 0.25) { const x = cx - nx * b, y = cy - ny * b; if (stand(x, y) && los(cx, cy, x, y)) { hx = x; hy = y; break; } }   // (back as far as the floor lets it)
    }
    const tx = -ny, ty = nx, ends = [];
    for (const sg of [-1, 1]) { let u = 0; for (let k = 0.1; k <= S.width / 2 + 1e-6; k += 0.1) { if (!los(cx, cy, cx + tx * k * sg, cy + ty * k * sg)) break; u = k; } ends.push(u * sg); }
    return { cx, cy, nx, ny, u0: ends[0], u1: ends[1], hx, hy };
}
function techShieldAt(tech, foe) {
    if (!_techFoeOk(foe)) return { ok: false, why: "PICK AN ENEMY" };
    if (typeof facilitySeesFrom === "function" && !facilitySeesFrom(tech.x, tech.y, foe.x, foe.y)) return { ok: false, why: "THE TECHNICIAN CANNOT SEE IT" };
    const S = TECH_AB.shield, P = _techShieldPlace(tech, foe), f0 = _techFrame();
    const W = { id: ++_techShieldN, by: tech, x: P.cx, y: P.cy, nx: P.nx, ny: P.ny, u0: P.u0, u1: P.u1, t0: f0, until: f0 + S.life, hits: [] };
    techShields.push(W);
    if (typeof actors !== "undefined") for (const a of actors) if (_techStops(a)) _techShieldOut(W, a);   // (one caught on its line is put out on its own side)
    tech._abReadyAt = f0 + techCooldown(tech, S.cooldown); tech._shieldHold = { id: W.id, x: P.hx, y: P.hy }; tech.attackOrder = null; tech.job = null;
    _techSay("◈ PHOTONIC SHIELD · " + Math.round(S.life / 60) + " S", "#5ff7e0");
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "ring", x: W.x, y: W.y, radius: 1.2, color: "#5ff7e0", life: 26 });
    return { ok: true, shield: W };
}
// A PHOTONIC SHIELD RAISED FOR THE PLAYER (BULWARK ENGINEER, a Player card: js/playercards.js playerCellShield): the core technician's wall, placed as the technician places its own, between `from` (the player)
// and the point (tx, ty) (a creature locked, or a point straight ahead), for `life` frames. Nobody holds behind it, and it costs no technician its wait. Straight ahead, it goes up as far out as the floor in sight
// allows (TECH_AB.shield.back at most); with less than a tile of floor in front, none goes up. Returns { ok, shield } or { ok: false, why }.
function techShieldRaise(from, tx, ty, life, foe) {
    if (!from) return { ok: false, why: "NOBODY TO RAISE IT" };
    const S = TECH_AB.shield, f0 = _techFrame(), los = (x0, y0, x1, y1) => typeof facilityLosFrom !== "function" || facilityLosFrom(x0, y0, x1, y1), stand = (x, y) => typeof facilityStandOk !== "function" || facilityStandOk(x, y);
    let aim = foe && _techFoeOk(foe) && (typeof facilitySeesFrom !== "function" || facilitySeesFrom(from.x, from.y, foe.x, foe.y)) ? foe : null;   // (aimed at what is seen, over low objects too; the floor in front is the walking test, los)
    if (!aim) {
        const dx = tx - from.x, dy = ty - from.y, D = Math.hypot(dx, dy) || 1, nx = dx / D, ny = dy / D; let k = 0;
        for (let s = 0.5; s <= S.back + 1e-6; s += 0.25) { const x = from.x + nx * s, y = from.y + ny * s; if (!los(from.x, from.y, x, y) || !stand(x, y)) break; k = s; }
        if (k < 1) return { ok: false, why: "NO ROOM FOR A SHIELD" };
        aim = { x: from.x + nx * (k + S.gap), y: from.y + ny * (k + S.gap) };   // (the technician's rule then puts it k tiles out: at its full reach, or just short of what is in the way)
    }
    const P = _techShieldPlace(from, aim);
    const W = { id: ++_techShieldN, by: null, x: P.cx, y: P.cy, nx: P.nx, ny: P.ny, u0: P.u0, u1: P.u1, t0: f0, until: f0 + (life > 0 ? life : S.life), hits: [] };
    techShields.push(W);
    if (typeof actors !== "undefined") for (const a of actors) if (_techStops(a)) _techShieldOut(W, a);   // (one caught on its line is put out on its own side)
    _techSay("◈ PHOTONIC SHIELD · " + Math.round((W.until - f0) / 60) + " S", "#5ff7e0");
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "ring", x: W.x, y: W.y, radius: 1.2, color: "#5ff7e0", life: 26 });
    return { ok: true, shield: W };
}
function _techShieldOn(W) { return _techFrame() < W.until; }
function _techShieldS(W, x, y) { return (x - W.x) * W.nx + (y - W.y) * W.ny; }   // which side of it, and how far (+: the side the technician faced)
function _techShieldU(W, x, y) { return -(x - W.x) * W.ny + (y - W.y) * W.nx; }   // where along it
// does the line from (x0,y0) to (x1,y1) go through it? (past its ends by a body's width counts)
function _techShieldCuts(W, x0, y0, x1, y1) {
    const s0 = _techShieldS(W, x0, y0), s1 = _techShieldS(W, x1, y1); if ((s0 > 0) === (s1 > 0)) return false;
    const k = s0 / (s0 - s1), u = _techShieldU(W, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k), B = TECH_AB.shield.band;
    return u >= W.u0 - B && u <= W.u1 + B;
}
// the shield between two points, if one is up there (pure: nothing is changed)
function techShieldBetween(x0, y0, x1, y1) { for (const W of techShields) if (_techShieldOn(W) && _techShieldCuts(W, x0, y0, x1, y1)) return W; return null; }
// an enemy's bite (or anything it means to hit) at `tgt` across a shield: stopped, and the shield shows where
function techShieldBlocks(src, tgt) {
    if (!techShields.length || !src || !tgt || !_techStops(src)) return false;
    const W = techShieldBetween(src.x, src.y, tgt.x, tgt.y); if (!W) return false;
    _techShieldHit(W, src.x, src.y, tgt.x, tgt.y); return true;
}
// an enemy's shot (js/game.js): stopped where its step crosses a shield
function techShieldStopsShot(p) {
    if (!techShields.length || !p || !p.targetsGreen) return false;
    const x0 = p.x - p.vx, y0 = p.y - p.vy, W = techShieldBetween(x0, y0, p.x, p.y); if (!W) return false;
    _techShieldHit(W, x0, y0, p.x, p.y); return true;
}
function _techShieldHit(W, x0, y0, x1, y1) {
    const s0 = _techShieldS(W, x0, y0), s1 = _techShieldS(W, x1, y1), k = Math.abs(s0 - s1) > 1e-9 ? s0 / (s0 - s1) : 0.5, f0 = _techFrame();
    W.hits.push({ u: _techShieldU(W, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k), t: f0 }); if (W.hits.length > 8) W.hits.shift();
    if (!W.saidAt || f0 - W.saidAt > 45) { W.saidAt = f0; if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, text: "BLOCKED", color: "#5ff7e0", life: 40, vy: -0.05, size: 11 }); }
}
// put an enemy caught on a shield's line out on its own side (or the other, if its own is wall)
function _techShieldOut(W, a) {
    const B = TECH_AB.shield.band, s = _techShieldS(W, a.x, a.y), u = _techShieldU(W, a.x, a.y);
    if (Math.abs(s) >= B || u < W.u0 - B || u > W.u1 + B) return;
    for (const side of s >= 0 ? [1, -1] : [-1, 1]) { const push = side * B - s, x = a.x + W.nx * push, y = a.y + W.ny * push; if (typeof facilityStandOk !== "function" || facilityStandOk(x, y)) { a.x = x; a.y = y; return; } }
}
// AN ENEMY'S STEP (js/npc.js updateNPC, after the walls; a knock, a pull): from (px,py) to where it is now. Across a shield (or into it), it is held on its own side and slides along it; round an end is free.
function techShieldKeep(a, px, py) {
    if ((!techShields.length && !techReefs.length) || !_techStops(a)) return;
    if (techReefs.length) _techReefKeep(a, px, py);   // (nor into REEF's rock and crystal: below)
    const B = TECH_AB.shield.band;
    for (const W of techShields) {
        if (!_techShieldOn(W)) continue;
        const s0 = _techShieldS(W, px, py), s1 = _techShieldS(W, a.x, a.y), side = s0 >= 0 ? 1 : -1;
        if (side * s1 >= B) continue;   // clear of it, on its own side
        const k = Math.abs(s0 - s1) > 1e-9 ? Math.max(0, Math.min(1, (s0 - side * B) / (s0 - s1))) : 1;
        const u = _techShieldU(W, px + (a.x - px) * k, py + (a.y - py) * k);
        if (u < W.u0 - B || u > W.u1 + B) continue;   // round its end
        const push = side * B - s1, x0 = a.x, y0 = a.y; a.x += W.nx * push; a.y += W.ny * push;
        if (typeof facilityConstrain === "function") facilityConstrain(a, px, py);   // (and the walls still hold it)
        if (x0 !== a.x || y0 !== a.y) W.pressedAt = _techFrame();
    }
}
// the shields' clock, and the technicians holding behind them
function _techShieldTick() {
    const f0 = _techFrame();
    if (techShields.length) techShields = techShields.filter(W => f0 < W.until);
    for (const f of followers) {
        const H = f && f._shieldHold; if (!H) continue;
        const W = techShields.find(w => w.id === H.id);
        if (!W || f.dead || !_techMember(f) || f.attackOrder || f.job || f.retreatUntil > f0 || (typeof player !== "undefined" && Math.hypot(player.x - f.x, player.y - f.y) > TECH_AB.shield.leash)) { f._shieldHold = null; f._fpWalkGoal = null; }
    }
}
// ── THE THERMITE DRILL (fire) ──
// ASKED: "Place a distinctive rubble patch at the midpoint of the southern wall. Keep it visually distinguishable from ordinary indestructible walls [...] Allow the player to long-press the rubble and select Thermite Drill. Have the
// Fire Technician travel to the target and drill it. Destroy the rubble after six successful drill hits. Spawn collectible rocks exactly once upon destruction. Preserve the resulting opening [...] Allow the ability to target enemies
// through the Technician HUD. Reuse the same ability framework and cooldown handling for environmental and enemy targets [...] do not implement an unrequested dungeon system"; then: the arena's south rock, on its nearest straight
// stretch (its middle is on a slant), the map not changed; one hit a second; behind it a SEALED DARK HOLE (seen into, not walked into yet: the future insect burrow), kept; 3 rocks once, a pack item with no use yet; against an enemy
// 3 hits, a second apart, each twice its normal hit.
//   THE RUBBLE is map data (`rubble`, js/facilitymap.js): a pile against a room's edge, drawn over it (no wall is changed: the hole is not walked into). The hits it has taken are kept (`_fp.rubbleHits`, saved).
//   ITS WAY IN: a long press on it, THERMITE DRILL on its ring (js/input.js, js/draw.js, js/commands.js): a fire technician in your squad, its drill ready, walks to it and drills, a hit a second, through techAbilityUse like
//     every other use. The cooldown starts at the first hit. After `hits` the rubble is gone and the hole is there for good, and `rocks` rocks lie in front of it: pickups (walk over them), made once.
//   AN ENEMY: the chip, then an enemy it can see (or the enemy card): it closes in and drills it `foeHits` times a second apart, each `foeMult` times its normal hit (followerAttack's plain hit: a quarter of its attack), as fire.
function _techRubbles() { return (typeof _fp !== "undefined" && _fp && _fp.F && _fp.F.rubble) || []; }
function _techRubble(id) { return _techRubbles().find(r => r.id === id) || null; }
function _techRubbleHits() { if (!_fp.rubbleHits) _fp.rubbleHits = {}; return _fp.rubbleHits; }
function techRubbleLeft(r) { return r ? Math.max(0, TECH_AB.drill.hits - (_techRubbleHits()[r.id] || 0)) : 0; }
function techRubbleOpen(r) { return !!r && techRubbleLeft(r) <= 0; }   // drilled through: the hole
function techRubbleSnapshot() { if (typeof _fp === "undefined" || !_fp) return {}; const o = {}, H = _techRubbleHits(); for (const k in H) if (H[k] > 0 && _techRubble(k)) o[k] = Math.min(TECH_AB.drill.hits, H[k] | 0); return o; }
// a saved game's rubble: the hits it had taken; one drilled through has its hole, and its rocks (the save's `taken` then puts away the ones that were picked up: js/facilitysave.js runs this first)
function techRubbleApply(o) {
    if (typeof _fp === "undefined" || !_fp) return; _fp.rubbleHits = {};
    for (const r of _techRubbles()) { const n = o && Number.isFinite(o[r.id]) ? Math.max(0, Math.min(TECH_AB.drill.hits, o[r.id] | 0)) : 0; if (n) _fp.rubbleHits[r.id] = n; if (n >= TECH_AB.drill.hits) { _techChokeOpen(r); _techRocksOut(r, true); } }
}
// a CHOKE drilled through (rubble with a `solid`): the solid that filled the passage's mouth is taken out of the way for good (js/facilityplay.js facilitySolidOpen); nothing for rubble against a wall
function _techChokeOpen(r) { return !!(r && r.solid && typeof facilitySolidOpen === "function" && facilitySolidOpen(r.solid)); }
// can this technician get to the rubble's work spot from where it stands? A choke drilled from INSIDE has its work spot in the pocket: from the ledge the order is refused, and says how to get in
function _techCanReach(f, r) { const wc = _techComp(r.work[0], r.work[1]), fc = _techComp(f.x, f.y); return wc === undefined || fc === wc; }
// where its rocks lie: in front of it, round the spot the technician drills from
function _techRockSpots(r) {
    const dx = r.work[0] - r.at[0], dy = r.work[1] - r.at[1], L = Math.hypot(dx, dy) || 1, nx = dx / L, ny = dy / L, tx = -ny, ty = nx, out = [];
    for (const [t, n] of [[-0.75, 0.15], [0, 0.55], [0.75, 0.1]]) {
        let x = r.work[0] + tx * t + nx * n, y = r.work[1] + ty * t + ny * n;
        if (typeof facilityStandOk === "function" && !facilityStandOk(x, y) && typeof _fpNearestCell === "function") { const c = _fpNearestCell(x, y); if (c) { x = c[0]; y = c[1]; } }
        out.push([x, y]);
    }
    return out.slice(0, TECH_AB.drill.rocks);
}
// the rocks, once: pickups on the floor (js/facilitytutorial.js), each one rock (ITEMS.rock, js/inventory.js); `quiet`: a saved game putting them back (no column of light)
function _techRocksOut(r, quiet) {
    if (!_fp.items || typeof _fpPickupItem !== "function") return 0;
    let n = 0;
    _techRockSpots(r).forEach((p, k) => {
        const id = "rock_" + r.id + "_" + (k + 1); if (_fp.items.some(i => i.fp === "pickup" && i.id === id)) return;
        const it = _fpPickupItem({ id, room: r.room, at: p, items: [["rock", 1]] }); it.rock = true; if (!quiet) it.arrive = _techFrame(); _fp.items.push(it); n++;
    });
    return n;
}
function _techFireTechs() { return (typeof partyMembers === "function" ? partyMembers() : []).filter(f => { const ab = techAbilityOf(f); return ab && ab.id === "thermite_drill"; }); }
function _techDrilling(r) { return typeof followers !== "undefined" && followers.some(a => a && !a.dead && a._drill && a._drill.rubble === r.id); }
// the rubble's ring (THERMITE DRILL): the fire technician in the squad whose drill is ready goes, through the one way in
function techRubbleDrill(r) {
    if (!r) return { ok: false, why: "NO RUBBLE HERE" };
    if (techRubbleOpen(r)) return { ok: false, why: "IT IS DRILLED THROUGH" };
    const techs = _techFireTechs(); if (!techs.length) return { ok: false, why: "THE THERMITE DRILL NEEDS A FIRE TECHNICIAN IN YOUR SQUAD" };
    const t = techs.find(f => techAbilityCan(f).ok && _techCanReach(f, r)) || techs.find(f => techAbilityCan(f).ok) || techs[0], res = techAbilityUse(t, { rubble: r }); if (res.ok) res.tech = t;   // (the one that can get there first)
    return res;
}
function _techDrillRubble(tech, r) {
    if (techRubbleOpen(r)) return { ok: false, why: "IT IS DRILLED THROUGH" };
    if (_techDrilling(r)) return { ok: false, why: "IT IS BEING DRILLED" };
    if (!_techCanReach(tech, r)) return { ok: false, why: r.inside ? "IT IS DRILLED FROM INSIDE · SEND A FIRE TECHNICIAN IN WITH THE KINETIC LAUNCHER" : "IT CANNOT GET TO THE RUBBLE FROM HERE" };   // (the choke of a tunnel: the way in is the launcher)
    _techDrillStart(tech, { rubble: r.id }); return { ok: true };
}
function techDrillFoe(tech, foe) {
    if (!_techFoeOk(foe)) return { ok: false, why: "PICK AN ENEMY", again: true };
    if (typeof facilitySeesFrom === "function" && !facilitySeesFrom(tech.x, tech.y, foe.x, foe.y)) return { ok: false, why: "THE TECHNICIAN CANNOT SEE IT", again: true };
    _techDrillStart(tech, { foe }); return { ok: true };
}
function _techDrillStart(t, o) { t._drill = Object.assign({ t0: _techFrame(), workAt: null, next: 0, hits: 0 }, o); t._abBusy = { kind: "drill" }; t.job = null; t.attackOrder = null; t._shieldHold = null; }
function _techDrillStop(f, why) { f._drill = null; f._abBusy = null; f._fpWalkGoal = null; if (why) _techSay(why, "#ff8a6a"); }
// a drill's hit, as fire: what is hit, and where
function _techDrillFx(x, y) {
    if (typeof elementEffects !== "undefined") { elementEffects.push({ type: "impact", x, y, color: "#ff8a3a", radius: 0.7, life: 18 }); elementEffects.push({ type: "ring", x, y, radius: 0.5, color: "#ffd27a", life: 14 }); }
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 2);
}
function _techDrillTick(f, f0) {
    const W = f._drill, T = TECH_AB.drill;
    if (f.returningToCrystal || !_techMember(f)) return _techDrillStop(f, W.hits ? null : "THE DRILL IS OFF");
    if (W.rubble) {
        const r = _techRubble(W.rubble); if (!r || techRubbleOpen(r)) return _techDrillStop(f, null);
        if (W.workAt === null) {
            if (f0 - W.t0 > T.walk) return _techDrillStop(f, "THE DRILL IS OFF · " + _techName(f) + " COULD NOT GET THERE");
            if (Math.hypot(r.work[0] - f.x, r.work[1] - f.y) > 0.6) return;
            W.workAt = f0; W.next = f0;
        }
        if (f0 < W.next) return;
        if (!W.hits) f._abReadyAt = f0 + techCooldown(f, T.cooldown);   // (the cooldown starts at its first hit)
        W.hits++; W.next = f0 + T.every; const H = _techRubbleHits(); H[r.id] = (H[r.id] || 0) + 1;
        _techDrillFx(r.at[0], r.at[1]);
        if (H[r.id] >= T.hits) {
            const opened = _techChokeOpen(r), n = _techRocksOut(r, false); _techDrillStop(f, null);
            _techSay(opened ? "✹ THE CHOKE IS DRILLED THROUGH · THE TUNNEL IS OPEN" + (n ? " · " + n + " ROCKS" : "") : "✹ THE RUBBLE IS DRILLED THROUGH · A DARK HOLE" + (n ? " · " + n + " ROCKS" : ""), "#ff9a4a");
            if (typeof shake !== "undefined") shake = Math.max(shake || 0, 7);
            if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: r.at[0], y: r.at[1], color: "#ffb070", radius: 1.4, life: 30 });
        }
        return;
    }
    const foe = W.foe; if (!foe || foe.dead) return _techDrillStop(f, null);
    const d = Math.hypot(foe.x - f.x, foe.y - f.y);
    if (W.workAt === null) {
        if (f0 - W.t0 > T.foeWait) return _techDrillStop(f, "THE DRILL IS OFF · " + _techName(f) + " COULD NOT GET THERE");
        if (d > T.reach) return;
        W.workAt = f0; W.next = f0;
    }
    if (f0 - W.next > T.foeWait) return _techDrillStop(f, "THE DRILL IS OFF · IT GOT AWAY");
    if (f0 < W.next || d > T.reach + 0.4) return;   // (out of reach: it closes in again, techStepOverride)
    if (!W.hits) f._abReadyAt = f0 + techCooldown(f, T.cooldown);
    W.hits++; W.next = f0 + T.every;
    const dmg = ((f.stats && f.stats.attack) || 5) * 0.25 * T.foeMult;
    if (typeof applyElementalDamage === "function") applyElementalDamage(foe, dmg, f, "fire", DMG_HIT_ALT); else if (typeof applyDamage === "function") applyDamage(foe, dmg, f, "fire", false, false, DMG_HIT_ALT);
    _techDrillFx(foe.x, foe.y);
    if (W.hits >= T.foeHits || foe.dead) _techDrillStop(f, null);
}
// the rubble's ring (js/draw.js drawRadialMenu, js/input.js): THERMITE DRILL above, and what it says under the ring; null once it is a hole
function techRingFor(r) {
    if (!r || techRubbleOpen(r)) return null;
    const left = techRubbleLeft(r);
    return { up: { label: "THERMITE DRILL", act: "drill" }, caption: (r.tag || (r.solid ? "CHOKED TUNNEL" : "RUBBLE")) + " · " + left + " HIT" + (left === 1 ? "" : "S") + " TO DRILL THROUGH" + (r.inside ? " · FROM INSIDE" : "") };
}
function techRingAct(r, act) {
    if (act !== "drill") return { ok: false };
    const res = techRubbleDrill(r);
    _techSay(res.ok ? "✹ " + _techName(res.tech) + " GOES TO DRILL THE RUBBLE" : res.why, res.ok ? "#ff9a4a" : "#ff8a6a");
    return res;
}
// the rubble under a press on the screen (js/input.js handleLongHold): { r, d } or null; a hole has no ring
function techRubbleAtScreen(ex, ey) {
    if (typeof _fp === "undefined" || !_fp || typeof player === "undefined") return null;
    let best = null; for (const r of _techRubbles()) { if (techRubbleOpen(r)) continue; const p = _techScr(r.at[0], r.at[1]), d = Math.hypot(ex - p.x, ey - (p.y + TILE_H - 14)); if (d < 64 && (!best || d < best.d)) best = { r, d }; }
    return best;
}
function _techRubbleNotices() {
    if (typeof player === "undefined") return;
    if (!_fp.rubbleNear) _fp.rubbleNear = new Set();
    for (const r of _techRubbles()) {
        const near = Math.hypot(r.at[0] - player.x, r.at[1] - player.y) <= TECH_AB.drill.near;
        if (near && !_fp.rubbleNear.has(r.id)) { _fp.rubbleNear.add(r.id); if (!techRubbleOpen(r)) _techSay(r.say ? "✹ " + r.say : r.inside ? "✹ A COLLAPSED TUNNEL · ITS CHOKE IS DRILLED FROM INSIDE: A FIRE TECHNICIAN LAUNCHED IN CAN OPEN IT" : r.solid ? "✹ A COLLAPSED TUNNEL, CHOKED WITH RUBBLE · A FIRE TECHNICIAN CAN DRILL IT THROUGH FROM HERE: PRESS AND HOLD IT" : "✹ RUBBLE IN THE ROCK · A FIRE TECHNICIAN CAN DRILL IT: PRESS AND HOLD IT", "#ff9a4a"); }
        else if (!near) _fp.rubbleNear.delete(r.id);
    }
}

// ── THE FROST PATCH (ice) ──
// ASKED: "Implement the Level 1 Frost Patch using existing terrain and status-effect systems [...] dimensions, duration, slowing effects, and sliding behavior"; then 3×3, 10 s, enemies at half speed, on a spot the player taps that the
// technician can see, there at once; "sliding" for your own units: they cross faster. ICE BRIDGES wait for a place to cross ("they'll be like sewer somewhere on the map").
//   The patch is the 3×3 tiles round the tapped tile that are floor in sight of its middle. Its effect is the game's own slow (js/abilities.js applySlow): an enemy on it is held at `slow` (a stronger slow it has is kept), and
//   your units (followers and clones) are hastened to `boost` (a slow they have is kept). It is gone after `life`. Nothing is saved.
let techFrosts = [];   // { x, y (the middle tile), tiles (Set of "x,y"), t0, until, by }
function techFrostAt(tech, spot) {
    if (!spot || !Number.isFinite(spot.x) || !Number.isFinite(spot.y)) return { ok: false, why: "TAP THE FLOOR", again: true };
    const cx = Math.round(spot.x), cy = Math.round(spot.y);
    if (_techWaterAt(cx, cy)) return techIceBridgeAt(tech, spot);   // water: a bridge (the same chip, the same wait)
    if (typeof facilityStandOk === "function" && !facilityStandOk(cx, cy)) return { ok: false, why: "TAP THE FLOOR", again: true };
    if (typeof facilitySeesFrom === "function" && !facilitySeesFrom(tech.x, tech.y, cx, cy)) return { ok: false, why: "THE TECHNICIAN CANNOT SEE THERE", again: true };
    const T = TECH_AB.frost, f0 = _techFrame(), h = Math.floor(T.size / 2), tiles = new Set();
    for (let dx = -h; dx <= h; dx++) for (let dy = -h; dy <= h; dy++) { const x = cx + dx, y = cy + dy; if ((typeof facilityStandOk !== "function" || facilityStandOk(x, y)) && (typeof facilityLosFrom !== "function" || facilityLosFrom(cx, cy, x, y))) tiles.add(x + "," + y); }
    techFrosts.push({ x: cx, y: cy, tiles, t0: f0, until: f0 + T.life, by: tech });
    tech._abReadyAt = f0 + techCooldown(tech, T.cooldown);
    _techSay("❄ FROST PATCH · " + Math.round(T.life / 60) + " S", "#9be8ff");
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "ring", x: cx, y: cy, radius: 1.6, color: "#9be8ff", life: 24 });
    return { ok: true };
}
// ── ICE BRIDGES (the ice technician's utility on water; the owner, 2026-11-06: "One ability", "Straight, 30 s"; docs/NEXT-PHASE-ROADMAP.md §14.2) ──
// The FROST PATCH chip aimed at water the technician can see freezes a straight bridge across it, there at once: TECH_AB.frost.bridgeWide tiles wide, along the axis nearer the line from the technician to the spot,
// from bank to bank (both ends must be floor), at most bridgeMax tiles of water. It is floor while it stands (js/facilityplay.js facilityIceSet; everyone may cross it) and stands until the same technician
// makes its next bridge (the owner, 2026-11-07: "Until the next one"; it was 30 s), when the old one thaws; anyone on it
// then is put on the nearest floor. Several may stand at once. Nothing is saved (a save loads with the water as it was).
let techBridges = [];   // { rect: [x0, y0, x1, y1], t0, until, by }
function _techWaterAt(x, y) { if (typeof _fp === "undefined" || !_fp || !_fp.F || typeof facilitySolidAt !== "function") return false; if (typeof facilityIced === "function" && facilityIced(_fp.F, x, y)) return false; const s = facilitySolidAt(x, y, _fp.F); return !!(s && s.water); }
function _techFloorAt(x, y) { return typeof facilityStandOk === "function" ? facilityStandOk(x, y) : false; }
function techIceBridgePlan(tech, spot) {
    const T = TECH_AB.frost, cx = Math.round(spot.x), cy = Math.round(spot.y), alongX = Math.abs(cx - tech.x) >= Math.abs(cy - tech.y);
    const side = alongX ? (spot.y >= cy ? 1 : -1) : (spot.x >= cx ? 1 : -1), lanes = [];
    for (let w = 0; w < T.bridgeWide; w++) lanes.push(w === 0 ? 0 : side * w);
    const at = (lane, t) => alongX ? [cx + t, cy + lane] : [cx + lane, cy + t], tiles = [];
    for (const lane of lanes) {
        const [x0, y0] = at(lane, 0); if (!_techWaterAt(x0, y0)) return { ok: false, why: "TOO NEAR THE BANK: TAP FURTHER INTO THE WATER", again: true };
        let lo = 0, hi = 0; while (_techWaterAt(...at(lane, lo - 1)) && hi - lo < T.bridgeMax + 1) lo--; while (_techWaterAt(...at(lane, hi + 1)) && hi - lo < T.bridgeMax + 1) hi++;
        if (hi - lo + 1 > T.bridgeMax) return { ok: false, why: "TOO WIDE TO BRIDGE · " + T.bridgeMax + " TILES OF WATER AT MOST", again: true };
        if (!_techFloorAt(...at(lane, lo - 1)) || !_techFloorAt(...at(lane, hi + 1))) return { ok: false, why: "NO BANK TO REACH THERE", again: true };
        for (let t = lo; t <= hi; t++) tiles.push(at(lane, t));
    }
    const xs = tiles.map(p => p[0]), ys = tiles.map(p => p[1]);
    return { ok: true, rect: [Math.min(...xs) - 0.5, Math.min(...ys) - 0.5, Math.max(...xs) + 0.5, Math.max(...ys) + 0.5], tiles: tiles.length, alongX };
}
// THE BRIDGES IN THE SAVE (the owner, 2026-11-07: "Save ice bridges"; js/facilitysave.js): each bridge's tiles and its technician's uid. A load puts them back before the player's spot is checked
// (a player saved on the ice loads on it); a bridge whose technician is gone stands on. A game saved before has none.
function techBridgesSnapshot() { return techBridges.map(b => ({ rect: b.rect.slice(), by: (b.by && b.by.uid) || null })); }
function techBridgesApply(list) {
    techBridges = [];
    for (const b of (Array.isArray(list) ? list : [])) {
        const r = b && b.rect; if (!Array.isArray(r) || r.length !== 4 || !r.every(Number.isFinite)) continue;
        const by = b.by && typeof followers !== "undefined" ? followers.find(f => f && f.uid === b.by) || null : null;
        techBridges.push({ rect: r.slice(), t0: 0, until: Infinity, by });
    }
    if (typeof facilityIceSet === "function") facilityIceSet(techBridges.map(b => b.rect));
}
function techIceBridgeAt(tech, spot) {
    if (typeof facilitySeesFrom === "function" && !facilitySeesFrom(tech.x, tech.y, spot.x, spot.y)) return { ok: false, why: "THE TECHNICIAN CANNOT SEE THERE", again: true };
    const plan = techIceBridgePlan(tech, spot); if (!plan.ok) return plan;
    const T = TECH_AB.frost, f0 = _techFrame();
    techBridges = techBridges.filter(b => b.by !== tech);   // its last bridge thaws (one each): anyone on it is put on the nearest floor (facilityIceSet)
    techBridges.push({ rect: plan.rect, t0: f0, until: Infinity, by: tech });
    if (typeof facilityIceSet === "function") facilityIceSet(techBridges.map(b => b.rect));
    tech._abReadyAt = f0 + techCooldown(tech, T.cooldown);
    _techSay("❄ ICE BRIDGE · UNTIL ITS NEXT ONE", "#9be8ff");
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "ring", x: (plan.rect[0] + plan.rect[2]) / 2, y: (plan.rect[1] + plan.rect[3]) / 2, radius: 1.6, color: "#9be8ff", life: 24 });
    return { ok: true };
}
function _techBridgeTick(f0) {
    if (!techBridges.length) return;
    const keep = techBridges.filter(b => f0 < b.until); if (keep.length === techBridges.length) return;
    techBridges = keep; if (typeof facilityIceSet === "function") facilityIceSet(techBridges.map(b => b.rect));
    _techSay("❄ AN ICE BRIDGE THAWED", "#9be8ff");
}
function techOnFrost(a) { if (!techFrosts.length || !a) return null; const k = Math.round(a.x) + "," + Math.round(a.y); for (const P of techFrosts) if (_techFrame() < P.until && P.tiles.has(k)) return P; return null; }
function _techFrostTick(f0) {
    if (!techFrosts.length) return;
    techFrosts = techFrosts.filter(P => f0 < P.until); if (!techFrosts.length || typeof applySlow !== "function") return;
    const T = TECH_AB.frost;
    for (const a of actors) {
        if (!a || a.dead || a._flight || !techOnFrost(a)) continue;
        if (_techStops(a)) { if (!(a.slowed > 0 && a.slowFactor < T.slow)) applySlow(a, 4, T.slow); }   // an enemy: held at half its pace (a stronger slow it has, a web, is kept)
        else if (a.team === "green" && (a.isFollower || a.isClone) && !(a.slowed > 0 && a.slowFactor < 1)) applySlow(a, 4, T.boost);   // yours: faster across it (a slow on it is kept)
    }
}

// ── TOXIC PODS (toxic; the BLIGHT SPIDER's pools until build 2026-11-06k: the owner, 2026-11-06, "Shorter life", docs/NEXT-PHASE-ROADMAP.md §12.3) and THE PLAY CLOCK ──
// (The names below keep the pools' words: techPools, _techPoolLay. A pool is a pod now: a round field round a small pod, running down in TECH_AB.blight.life frames of play.)
// ASKED: "Create contamination pools. Make the pools persist for two complete in-game days. Implement gradual toxin reabsorption according to the established behavior. Use the existing day-cycle system rather than real-world timers.
// Prevent repeated updates from incorrectly extending pool duration or multiplying toxin reabsorption. Leave the death-spill behavior unresolved"; then: on a spot the player taps that it can see, the spider walks there and leaves a
// 2×2 pool; up to 3 (a 4th takes the oldest's place); 2 in-game days, a day being 20 minutes of play, play time only (a saved clock: nothing passes while the game is closed); the pool hurts enemies in it with the toxic cloud's own
// damage, every half second; reabsorption: the pool slowly fades, weaker and smaller, until it is gone. The death spill is not built.
//   THE PLAY CLOCK (`techClock`) counts the frames of play: it is saved, and a pool's age is the clock's, so a pool's time is the game's and not the wall's. Only the clock moves a pool on: its life is fixed when it is laid (born and
//   the clock), so nothing can stretch it, and its strength and size are worked out from its age each time (never taken off a little at a time), so nothing can make it fade faster.
let techClock = 0;    // frames of play (saved)
let techPools = [];   // { id, x, y (its middle), born (the clock), bite (its full bite), by }
let _techPoolN = 0;
function techPoolLife() { return TECH_AB.blight.life; }
function techPoolFade(P) { return Math.max(0, 1 - (techClock - P.born) / techPoolLife()); }   // 1 when it is laid, 0 when it is gone
function techDayOf(t) { return Math.floor((t === undefined ? techClock : t) / TECH_AB.day) + 1; }
function techBlightAt(tech, spot) {
    if (!spot || !Number.isFinite(spot.x) || !Number.isFinite(spot.y)) return { ok: false, why: "TAP THE FLOOR", again: true };
    const ox = Math.round(spot.x - 0.5), oy = Math.round(spot.y - 0.5), x = ox + 0.5, y = oy + 0.5;   // the 2×2 block of tiles nearest the spot: ox..ox+1, oy..oy+1
    if (typeof facilityStandOk === "function" && !facilityStandOk(spot.x, spot.y)) return { ok: false, why: "TAP THE FLOOR", again: true };
    if (typeof facilitySeesFrom === "function" && !facilitySeesFrom(tech.x, tech.y, spot.x, spot.y)) return { ok: false, why: "THE TECHNICIAN CANNOT SEE THERE", again: true };
    tech._blight = { x, y, t0: _techFrame() }; tech._abBusy = { kind: "blight" }; tech.job = null; tech.attackOrder = null; tech._shieldHold = null;
    _techSay("☣ " + _techName(tech) + " GOES TO PLACE A TOXIC POD", "#7dff4a");
    return { ok: true };
}
function _techPoolLay(f, x, y) {
    const T = TECH_AB.blight, bite = ((f.stats && f.stats.specialAttack) || 10) * 0.12 * 0.3;   // the toxic cloud's own bite (js/elements.js: a smoke bomb's cloud)
    techPools.push({ id: ++_techPoolN, x, y, born: techClock, bite, by: f.uid || null });
    while (techPools.length > T.max) techPools.shift();   // (a 4th takes the oldest's place)
    f._abReadyAt = _techFrame() + techCooldown(f, T.cooldown);
    _techSay("☣ TOXIC POD · " + techPools.length + " OF " + T.max + " · " + Math.round(T.life / 3600) + " MIN", "#7dff4a");
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x, y, color: "#7dff4a", radius: 1.0, life: 24 });
}
function _techBlightWalkTick(f, f0) {
    const B = f._blight, T = TECH_AB.blight, stop = why => { f._blight = null; f._abBusy = null; f._fpWalkGoal = null; if (why) _techSay(why, "#ff8a6a"); };
    if (f.returningToCrystal || !_techMember(f)) return stop("THE POD IS OFF");
    if (f0 - B.t0 > T.walk) return stop("THE POD IS OFF · " + _techName(f) + " COULD NOT GET THERE");
    if (Math.hypot(B.x - f.x, B.y - f.y) <= 0.5) { stop(null); _techPoolLay(f, B.x, B.y); }
}
function techInPool(a, P) { const k = techPoolFade(P), r = TECH_AB.blight.size / 2 * k; return k > 0 && Math.hypot(a.x - P.x, a.y - P.y) <= r; }   // (the pod's field: a round one, 2 tiles across, shrinking as it runs down)
function _techPoolTick() {
    if (!techPools.length) return;
    techPools = techPools.filter(P => techPoolFade(P) > 0);
    if (!techPools.length || techClock % TECH_AB.blight.every !== 0 || typeof applyDamage !== "function") return;
    for (const P of techPools) {
        const k = techPoolFade(P);
        for (const a of actors) if (a && !a.dead && _techStops(a) && !a.untargetable && techInPool(a, P)) applyDamage(a, P.bite * k, null);   // (weaker as it fades; the cloud's own way: no attacker)
    }
}
function techBlightSnapshot() { return { clock: techClock, pools: techPools.map(P => ({ x: P.x, y: P.y, born: P.born, bite: Math.round(P.bite * 1000) / 1000 })) }; }
function techBlightApply(d) {
    techClock = d && Number.isFinite(d.clock) ? Math.max(0, d.clock) : 0; techPools = [];
    for (const p of ((d && d.pools) || []).slice(-TECH_AB.blight.max)) if (p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.born)) techPools.push({ id: ++_techPoolN, x: p.x, y: p.y, born: Math.min(p.born, techClock), bite: Number.isFinite(p.bite) ? p.bite : 0.36, by: null });
    techPools = techPools.filter(P => techPoolFade(P) > 0);
}

// ── REEF (BLOOM; the coral crab's, build 2026-11-08m: docs/CONVERSION.md §2, docs/TECHNICIANS.md) ──
// ASKED: "Coral crab into the game next" (its look No. 914, approved). Its rules are the owner's (2026-11-02, 2026-11-08): REEF fires little shards, and rock and crystal grow where they land
// ("Make reef grow rock and crystal").
//   IN A FIGHT: the ◆ chip, then a spot of floor it can see on its own stretch of floor: an OUTCROP of rock and crystal there for TECH_AB.reef.life (20 s). Enemies cannot pass it (techShieldKeep holds them
//     outside it; one standing where it grows is put out beside it); your followers beside it are mended every `every` frames; you and your followers walk over it ("it can be stood on"). It hurts no one.
//   GETTING AROUND (the connected rule, "every Technician": no marked sites): the ◆ chip, then HIGH GROUND across an edge from its floor (or, from up there, the floor below): a CLIMB of rock and crystal up
//     the edge's face. It goes wherever the map has high ground over floor: an edge between two stretches of floor, one at least `rise` tiles of height above the other, with nothing between them but an
//     open face (REEF_FACES: what the map draws as the open face of a raised floor, the railing frame under the catwalks and the cliff under a deck; a plain wall is a room walled in) and no glass ("No, the
//     glass stops it"). On today's map that is the catwalks' west edge over the arena. Its FOOT is out on the low floor where the camera sees it, its TOP on the high floor's first tile. You and your
//     followers go up it and back down ("Player and followers", "Both ways"): walk to an end (a walk that ends on it), or tap its tag, and you are taken over it to the other end; a follower on the other
//     stretch from you goes over it to rejoin you. Creatures never do. It stands until the same coral crab makes its next climb ("Until the next one": one each) and is saved, as the ice bridges are.
//     Not from an ice bridge ("No"): neither end may be on ice.
//   ITS NUMBERS: TECH_AB.reef (the owner: "You pick, provisional"). REEF PILLAR (the coral crab's Ultimate, js/elements.js FORM_ULTIMATES.coralcrab) grows a row of these outcrops: techReefPillar.
let techReefs = [];    // the outcrops standing: { id, by, parts: [{ x, y, r }] (one; REEF PILLAR's three), x, y (the middle), from (where the shards flew from), t0 (they land: it grows), until, mend, mendReach, every, pillar }
let techClimbs = [];   // the climbs standing: { id, by, foot: [x, y], top: [x, y], edge: [x, y] (on the high ground's edge), n: [nx, ny] (from the low floor to the high), from, t0 }
let _techReefN = 0;
const REEF_FACES = new Set(["railing_wall", "deck_wall"]);   // the edges drawn as a raised floor's open face (js/facilitymap.js edge_kinds: the arena's under the catwalks and under the observation deck)
function techReefAt(tech, spot) {
    if (!spot || !Number.isFinite(spot.x) || !Number.isFinite(spot.y)) return { ok: false, why: "TAP THE FLOOR", again: true };
    const tc = _techComp(tech.x, tech.y), sc = _techComp(spot.x, spot.y);
    if (sc === undefined) return { ok: false, why: "TAP THE FLOOR", again: true };
    if (tc !== undefined && sc !== tc) return techReefClimbAt(tech, spot);   // another stretch of floor (high ground, or the floor below it): a climb
    const x = Math.round(spot.x), y = Math.round(spot.y);
    if (typeof facilityStandOk === "function" && !facilityStandOk(x, y)) return { ok: false, why: "TAP THE FLOOR", again: true };
    if (typeof facilitySeesFrom === "function" && !facilitySeesFrom(tech.x, tech.y, x, y)) return { ok: false, why: "THE TECHNICIAN CANNOT SEE THERE", again: true };
    const R = TECH_AB.reef, f0 = _techFrame();
    _techReefGrow(tech, [{ x, y, r: R.radius }], { life: R.life, mend: R.mend, mendReach: R.mendReach, every: R.every });
    tech._abReadyAt = f0 + techCooldown(tech, R.cooldown);
    _techSay("◆ REEF · AN OUTCROP OF ROCK AND CRYSTAL · " + Math.round(R.life / 60) + " S", "#ff7ab8");
    return { ok: true };
}
// an outcrop (or a row of them): its shards fly from `by` and it grows when they land (_techReefTick)
function _techReefGrow(by, parts, o) {
    const t0 = _techFrame() + TECH_AB.reef.shards, O = { id: ++_techReefN, by: by || null, parts, x: parts[0].x, y: parts[0].y, from: by ? [by.x, by.y] : null, t0, until: t0 + o.life, mend: o.mend, mendReach: o.mendReach, every: o.every, pillar: !!o.pillar, grown: false };
    techReefs.push(O);
    return O;
}
function _techReefOn(O, f0) { return f0 >= O.t0 && f0 < O.until; }
// a creature caught where a part grows is put out beside it: straight out from its middle, else round it, on floor (a REEF PILLAR's on its own side: away from the crab first)
function _techReefOut(c, a, O) {
    const need = c.r + TECH_AB.reef.body, dx = a.x - c.x, dy = a.y - c.y, d = Math.hypot(dx, dy); if (d >= need) return;
    const base = d > 1e-6 ? Math.atan2(dy, dx) : O && O.from ? Math.atan2(c.y - O.from[1], c.x - O.from[0]) : 0;
    for (const k of [0, 1, -1, 2, -2, 3, -3, 4]) { const t = base + k * Math.PI / 4, x = c.x + Math.cos(t) * need, y = c.y + Math.sin(t) * need; if (typeof facilityStandOk !== "function" || facilityStandOk(x, y)) { a.x = x; a.y = y; return; } }
}
// AN ENEMY'S STEP (techShieldKeep, from js/npc.js and the knocks): from (px,py) to where it is now. Into an outcrop, it is held at its edge and slides round it.
function _techReefKeep(a, px, py) {
    const f0 = _techFrame(), B = TECH_AB.reef.body;
    for (const O of techReefs) {
        if (!_techReefOn(O, f0)) continue;
        for (const c of O.parts) {
            const need = c.r + B, dx = a.x - c.x, dy = a.y - c.y, d = Math.hypot(dx, dy); if (d >= need) continue;
            let ux, uy; if (d > 1e-6) { ux = dx / d; uy = dy / d; } else { const ex = px - c.x, ey = py - c.y, e = Math.hypot(ex, ey) || 1; ux = ex / e; uy = ey / e; }
            a.x = c.x + ux * need; a.y = c.y + uy * need;
            if (typeof facilityConstrain === "function") facilityConstrain(a, px, py);   // (and the walls still hold it)
            O.pressedAt = f0;
        }
    }
}
function techOnReef(a) { if (!techReefs.length || !a) return null; const f0 = _techFrame(); for (const O of techReefs) if (_techReefOn(O, f0) && O.parts.some(c => Math.hypot(a.x - c.x, a.y - c.y) < c.r)) return O; return null; }
// the outcrops' clock: each grows when its shards land (what stands there is put out), then mends your followers beside it every `every` frames, until it crumbles
function _techReefTick(f0) {
    if (!techReefs.length) return;
    techReefs = techReefs.filter(O => f0 < O.until);
    for (const O of techReefs) {
        if (f0 < O.t0) continue;
        if (!O.grown) {
            O.grown = true;
            if (typeof actors !== "undefined") for (const a of actors) if (_techStops(a) && !a._flight && !a._swallowedBy) for (const c of O.parts) _techReefOut(c, a, O);
            if (typeof elementEffects !== "undefined") for (const c of O.parts) elementEffects.push({ type: "ring", x: c.x, y: c.y, radius: c.r + 0.5, color: "#ff7ab8", life: 22 });
            if (typeof shake !== "undefined") shake = Math.max(shake || 0, O.pillar ? 6 : 2);
        }
        if ((f0 - O.t0) % O.every !== 0 || typeof healUnit !== "function" || typeof followers === "undefined") continue;
        for (const a of followers) {
            if (!a || a.dead || a.team !== "green" || a._flight || !(a.maxHealth > 0) || !(a.health < a.maxHealth)) continue;
            if (O.parts.some(c => Math.hypot(a.x - c.x, a.y - c.y) <= c.r + O.mendReach && (typeof facilitySeesFrom !== "function" || facilitySeesFrom(c.x, c.y, a.x, a.y)))) healUnit(a, a.maxHealth * O.mend, O.by);
        }
    }
}
// REEF PILLAR (the coral crab's Ultimate, js/elements.js FORM_ULTIMATES.coralcrab; the owner's design, 2026-11-08: "A giant spike erupts from the ground between the target and the technician", "Blocks and heals
// only"): a giant crystal spike erupts on the line from the crab to its target, TECH_AB.pillar.gap in front of the target, with a lesser spike either side of it across the line (where the floor goes), so the
// three stand like a wall in the enemy's way. They block as an outcrop does, mend your followers near them, and hurt no one. Returns the outcrop, or null when there is no floor for it.
function techReefPillar(by, foe) {
    if (!by || !foe) return null;
    const P = TECH_AB.pillar, dx = foe.x - by.x, dy = foe.y - by.y, D = Math.hypot(dx, dy) || 1e-6, nx = dx / D, ny = dy / D;
    const k = D >= 2 * P.gap ? D - P.gap : D / 2, los = (x0, y0, x1, y1) => typeof facilityLosFrom !== "function" || facilityLosFrom(x0, y0, x1, y1), stand = (x, y) => typeof facilityStandOk !== "function" || facilityStandOk(x, y);
    let cx = by.x + nx * k, cy = by.y + ny * k;
    if (!stand(cx, cy) || !los(by.x, by.y, cx, cy)) { let ok = false; for (let s = k - 0.25; s >= 0.75; s -= 0.25) { const x = by.x + nx * s, y = by.y + ny * s; if (stand(x, y) && los(by.x, by.y, x, y)) { cx = x; cy = y; ok = true; break; } } if (!ok) return null; }
    const parts = [{ x: cx, y: cy, r: P.core }], tx = -ny, ty = nx;
    for (const sg of [-1, 1]) { const x = cx + tx * P.spread * sg, y = cy + ty * P.spread * sg; if (stand(x, y) && los(cx, cy, x, y)) parts.push({ x, y, r: P.flank }); }
    return _techReefGrow(by, parts, { life: P.life, mend: P.mend, mendReach: P.mendReach, every: P.every, pillar: true });
}

// ── REEF's climbs: where they can go, making one, and going over one ──
function _techSegDist(a, b, x, y) { const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy, t = l2 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2)) : 0; return Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y); }
// the climb at a point (qx, qy) of a wall piece, between the stretches `ca` (the technician's) and `cb` (the one tapped): { foot, top, edge, n, lo, hi } or null
function _techReefEdgeAt(w, qx, qy, ca, cb) {
    const R = TECH_AB.reef, F = _fp.F, dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, side = [];
    for (const s of [-1, 1]) { let P = null; for (let k = 0.3; k <= 2.5 + 1e-9; k += 0.25) { const x = qx + nx * s * k, y = qy + ny * s * k; if (facilityStandOk(x, y)) { P = [Math.round(x), Math.round(y)]; break; } } if (!P) return null; side.push(P); }   // the floor's first tile either side
    const c0 = _techComp(side[0][0], side[0][1]), c1 = _techComp(side[1][0], side[1][1]);
    if (c0 === undefined || c1 === undefined || c0 === c1 || !((c0 === ca && c1 === cb) || (c0 === cb && c1 === ca))) return null;   // (two stretches, the technician's and the one tapped: one stretch has its own way)
    const h0 = facilityHeightAt(side[0][0], side[0][1], F), h1 = facilityHeightAt(side[1][0], side[1][1], F); if (Math.abs(h1 - h0) < R.rise) return null;
    const lo = h0 < h1 ? 0 : 1, P0 = side[lo], P1 = side[1 - lo], s = lo === 0 ? 1 : -1, cLo = lo === 0 ? c0 : c1, cHi = lo === 0 ? c1 : c0;   // (s: the normal's way from the low floor to the high)
    if (facilityIced(F, P0[0], P0[1]) || facilityIced(F, P1[0], P1[1])) return null;   // ("No": an ice bridge is not floor to climb from)
    let face = false;   // what lies between the two floors: no glass, and the high floor's open face
    for (const v of F.walls) { if (!facilitySegmentsCross(P0, P1, v.a, v.b)) continue; if (v.window) return null; if (REEF_FACES.has(v.kind)) face = true; }
    if (!face) return null;
    const ox = -nx * s, oy = -ny * s; let foot = null;   // out onto the low floor, where the camera sees it: `foot` tiles out, less where the floor stops
    for (let k = R.foot; k >= 0; k -= 0.5) { const x = Math.round(P0[0] + ox * k), y = Math.round(P0[1] + oy * k); if (facilityStandOk(x, y) && _techComp(x, y) === cLo && facilityLosFrom(P0[0], P0[1], x, y)) { foot = [x, y]; break; } }
    if (!foot) return null;
    return { foot, top: P1.slice(), edge: [qx, qy], n: [nx * s, ny * s], lo: cLo, hi: cHi };
}
// THE PLAN: of the edges within `search` tiles of the tap that join the technician's floor to the floor tapped, the climb nearest the tap whose end on the technician's floor it can see
function techReefClimbPlan(tech, spot) {
    const R = TECH_AB.reef, F = typeof _fp !== "undefined" && _fp ? _fp.F : null; if (!F || typeof facilityStandOk !== "function") return { ok: false, why: "NO HIGH GROUND TO CLIMB THERE", again: true };
    const ca = _techComp(tech.x, tech.y), cb = _techComp(spot.x, spot.y); let best = null, unseen = false;
    for (const w of F.walls) {
        if (w.window || _techSegDist(w.a, w.b, spot.x, spot.y) > R.search) continue;
        const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.hypot(dx, dy); if (L < 0.1) continue;
        const n = Math.max(1, Math.round(L / 0.5));
        for (let i = 0; i < n; i++) {
            const t = (i + 0.5) / n, qx = w.a[0] + dx * t, qy = w.a[1] + dy * t, d = Math.hypot(qx - spot.x, qy - spot.y);
            if (d > R.search || (best && d >= best.d)) continue;
            const e = _techReefEdgeAt(w, qx, qy, ca, cb); if (!e) continue;
            const own = e.lo === ca ? e.foot : e.top;
            if (typeof facilitySeesFrom === "function" && !facilitySeesFrom(tech.x, tech.y, own[0], own[1])) { unseen = true; continue; }
            best = Object.assign(e, { d });
        }
    }
    if (!best) return { ok: false, why: unseen ? "THE TECHNICIAN CANNOT SEE THE WAY UP THERE" : "NO HIGH GROUND TO CLIMB THERE", again: true };
    return Object.assign({ ok: true }, best);
}
function techReefClimbAt(tech, spot) {
    const plan = techReefClimbPlan(tech, spot); if (!plan.ok) return plan;
    const R = TECH_AB.reef, f0 = _techFrame();
    techClimbs = techClimbs.filter(c => c.by !== tech);   // its last climb crumbles ("Until the next one": one each)
    const C = { id: ++_techReefN, by: tech, foot: plan.foot, top: plan.top, edge: plan.edge, n: plan.n, from: [tech.x, tech.y], t0: f0 + R.shards };
    techClimbs.push(C);
    tech._abReadyAt = f0 + techCooldown(tech, R.cooldown);
    _techSay("◆ REEF · A CLIMB UP TO THE " + _techClimbName(C) + " · IT STANDS UNTIL ITS NEXT ONE", "#ff7ab8");
    return { ok: true, climb: C };
}
function _techClimbName(C) { const rm = typeof facilityRoomAt === "function" && typeof _fp !== "undefined" && _fp && _fp.F ? facilityRoomAt(C.top[0], C.top[1], _fp.F) : null; return String(rm ? rm.label : "HIGH GROUND").toUpperCase(); }
function _techClimb(id) { return techClimbs.find(c => c.id === id) || null; }
// the end of a climb on the stretch of floor (x, y) is on, and where it goes: { at, to, up } or null (null too while it grows, and once its two ends are one stretch: then it is walked)
function _techClimbEnd(C, x, y) {
    if (!C || _techFrame() < C.t0) return null;
    const c = _techComp(x, y), cf = _techComp(C.foot[0], C.foot[1]), ct = _techComp(C.top[0], C.top[1]); if (c === undefined || cf === ct) return null;
    return c === cf ? { at: C.foot, to: C.top, up: true } : c === ct ? { at: C.top, to: C.foot, up: false } : null;
}
// the nearest climb from the stretch (x, y) is on to the stretch `pc`: { c, E } or null (a follower rejoining you)
function _techClimbTo(x, y, pc) {
    let best = null, bd = Infinity;
    for (const c of techClimbs) { const E = _techClimbEnd(c, x, y); if (!E || _techComp(E.to[0], E.to[1]) !== pc) continue; const d = Math.hypot(E.at[0] - x, E.at[1] - y); if (d < bd) { bd = d; best = { c, E }; } }
    return best;
}
// a tap on a climb's tag (techSiteTap): you walk to its end and go over it
function techClimbGo(C) {
    const p = _techRider(); if (!p) return { ok: false, why: "NOBODY TO CLIMB" };
    if (_techRiderBusy(p)) return { ok: false, why: "NOT NOW" };
    const E = _techClimbEnd(C, p.x, p.y); if (!E) return { ok: false, why: "NO WAY OVER IT FROM HERE" };
    if (Math.hypot(E.at[0] - p.x, E.at[1] - p.y) > 0.5 && !(typeof facilityWalkTo === "function" && facilityWalkTo(E.at[0], E.at[1]))) return { ok: false, why: "NO WAY TO THE CLIMB FROM HERE" };
    p._launchLoad = null; p._dropSite = null; p._climbGo = C.id; p._climbT0 = _techFrame();   // (set after the walk: a new destination clears it, js/facilityplay.js facilityWalkTo)
    _techSay(E.up ? "◆ TO THE REEF · YOU CLIMB UP IT" : "◆ TO THE REEF · YOU CLIMB DOWN IT", "#ff7ab8");
    return { ok: true };
}
// THE CLIMBS IN THE SAVE (as the ice bridges are: "Until the next one"): each one's ends and its coral crab's uid. A load keeps one whose ends are still floor on two stretches; one whose crab is gone stands on.
function techClimbsSnapshot() { return techClimbs.map(c => ({ foot: c.foot.slice(), top: c.top.slice(), edge: c.edge.slice(), n: c.n.slice(), by: (c.by && c.by.uid) || null })); }
function techClimbsApply(list) {
    techClimbs = [];
    const pt = q => Array.isArray(q) && q.length === 2 && q.every(Number.isFinite);
    for (const c of (Array.isArray(list) ? list : [])) {
        if (!c || !pt(c.foot) || !pt(c.top)) continue;
        if (typeof facilityStandOk === "function" && (!facilityStandOk(c.foot[0], c.foot[1]) || !facilityStandOk(c.top[0], c.top[1]))) continue;
        const by = c.by && typeof followers !== "undefined" ? followers.find(f => f && f.uid === c.by) || null : null;
        if (by && techClimbs.some(o => o.by === by)) continue;   // (one each)
        techClimbs.push({ id: ++_techReefN, by, foot: c.foot.slice(), top: c.top.slice(), edge: pt(c.edge) ? c.edge.slice() : c.top.slice(), n: pt(c.n) ? c.n.slice() : [1, 0], from: null, t0: 0 });
    }
}

// ── FLUX MOVE (flux): the object tool (the rules: js/fluxmove.js; the move in the map: js/facilityplay.js facilitySolidMove; docs/FLUX-MOVEMENT.md) ──
// ASKED (the roadmap's Milestone One, the owner's): activate, select an eligible object, a placement grid (the valid and invalid places, the allowance, the footprint, the turns), choose the place, turn it in 90° steps,
// validate, confirm; "Canceling the ability or selecting an invalid destination must leave the object in its original position." The owner's answers: "Retire it now" (Telegrab), "60 s cooldown", "Prompt buttons",
// "FLUX MOVE", "Square".
//   THE AIM: the ✦ chip, then an object (the movable ones on the screen are outlined; any other prop says it does not move), then the grid: a tap on a tile shows the object there (a two-tile object's second
//   tile flashing); ⟳ ROTATE (R) turns a barrier a quarter turn; ✓ PLACE (Enter) places it. ✕ CALL OFF, Escape or the chip again: nothing moved. A tap on another movable object picks that one instead.
//   The object need only be on the screen: the technician need not see it (Telegrab's rule for the same technician; a reading, docs/FLUX-MOVEMENT.md §9.1).
//   THE COST: its wait (TECH_AB.flux.cooldown, through techCooldown: the cooldown cards and DOUBLE CHARGE apply) starts when the object is placed; a place refused costs nothing and the aim stays up.
function _fluxName(s) { return s ? String(s.kind || "object").replace(/_/g, " ").toUpperCase() : "IT"; }
// the aim's own state (kept in the aim, never on the object: every way out leaves the world untouched): the object, its turn, the tile chosen, the grid for each turn
function _techFluxAim() { const A = techAim; return A && A.flux ? A : null; }
function techFluxPick(s) {
    const A = _techFluxAim(); if (!A) return false;
    if (!s) { _techSay("TAP AN OBJECT · THE OUTLINED ONES MOVE", "#8aa0c8"); return true; }
    if (typeof fluxMovable !== "function" || !fluxMovable(s)) { _techSay("✦ THE " + _fluxName(s) + " DOES NOT MOVE", "#ff8a6a"); return true; }
    A.flux.s = s; A.flux.turn = false; A.flux.at = null; A.flux.region = fluxRegion(s); A.flux.grid = [null, null]; A.flux.grid[0] = fluxGrid(s, false);
    A.picks.object = s; A.step = 1; _techAimShow();
    return true;
}
// a tap on the grid: the tile it goes to (its first tile); a tap on another movable object picks that one; a tap off the reach says so
function techFluxTile(x, y) {
    const A = _techFluxAim(); if (!A || !A.flux.s) return false;
    const R = fluxRegion(A.flux.s);
    if (!R.has(x + "," + y)) { _techSay("TOO FAR · " + A.flux.s.flux.range + " TILES AT MOST", "#ff8a6a"); return true; }
    A.flux.at = [x, y]; _techAimShow();
    const c = fluxCheck(A.flux.s, x, y, A.flux.turn); if (!c.ok) _techSay(c.why, "#ff8a6a");
    return true;
}
// ⟳ ROTATE (the prompt's button, R): a quarter turn of the place shown (a two-tile object only)
function techFluxRotate() {
    const A = _techFluxAim(); if (!A || !A.flux.s) return false;
    if (!fluxCanTurn(A.flux.s)) { _techSay("THE " + _fluxName(A.flux.s) + " LOOKS THE SAME TURNED", "#8aa0c8"); return false; }
    A.flux.turn = !A.flux.turn; const i = A.flux.turn ? 1 : 0; if (!A.flux.grid[i]) A.flux.grid[i] = fluxGrid(A.flux.s, A.flux.turn);
    _techAimShow(); return true;
}
// ✓ PLACE (the prompt's button, Enter): the ability is used with the place shown (checked again: bodies move)
function techFluxPlace() {
    const A = _techFluxAim(); if (!A || !A.flux.s) return false;
    if (!A.flux.at) { _techSay("TAP WHERE IT GOES FIRST", "#8aa0c8"); return false; }
    return _techAimLast("place", { x: A.flux.at[0], y: A.flux.at[1], turn: A.flux.turn });
}
// THE USE (techAbilityUse, the one way in): the object to its place, or why not ({ again: true }: the aim stays up)
function techFluxMoveAt(tech, s, place) {
    if (!s || typeof fluxMovable !== "function" || !fluxMovable(s)) return { ok: false, why: "PICK AN OBJECT THAT MOVES", again: true };
    if (!place || !Number.isInteger(place.x) || !Number.isInteger(place.y)) return { ok: false, why: "TAP WHERE IT GOES", again: true };
    const r = fluxMoveTo(s, place.x, place.y, !!place.turn);
    if (!r.ok) return { ok: false, why: r.why, again: true };
    tech._abReadyAt = _techFrame() + techCooldown(tech, TECH_AB.flux.cooldown);
    _techSay("✦ FLUX MOVE · THE " + _fluxName(s), "#c77dff");
    return { ok: true };
}

// ── FAULTLINE (the evolved THERMITE BURROWER's second ability, beside the THERMITE DRILL; the owner's brief, 2026-11-02, docs/FOLLOWER-COMBAT-REDESIGN.md §2.4; "Keep both buttons") ──
// ASKED: "The player freely draws a path across the battlefield. Thermite Burrower dives underground. It follows the player-drawn route. Molten spikes erupt along the route. Enemies intersecting the
// eruption path are hit." Not a straight drag-to-aim line, a charge, or taps on separate waypoints: a continuous freehand stroke.
//   THE INPUT (js/input.js; the same on a mouse and a finger): after a tap on its chip, the next press on the floor starts the path, the drag draws it (a glowing line follows the pointer) and the
//   let-go sends it. A stroke under `minLen` sends nothing and the aim stays up; ✕ CALL OFF (the chip again), Escape or a touch the system cancels calls it off. The stroke stops growing at
//   `maxLen`. The path is resampled, smoothed and laid over the floor: it ends where a wall cuts it.
//   THE RUN: it dives where it stands, tunnels to the path's start, follows the path under the floor at `speed`, and a molten spike erupts every `spacing` tiles as it passes, hitting every enemy
//   within `hitR` of it, each enemy once a FAULTLINE, as its ability (DMG_HIT_ALT). Under the floor it cannot be targeted or hurt. The path glows from the moment it is drawn until a little after
//   it surfaces at its end. Its wait (`_ab2ReadyAt`) starts as it sets off.
function _faultLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return L; }
// a stroke (world points) -> the path: { ok, pts, len } or { ok: false, why }
function techFaultPath(f, stroke) {
    const T = TECH_AB.fault;
    if (!stroke || stroke.length < 2 || _faultLen(stroke) < T.minLen) return { ok: false, why: "DRAW A LONGER PATH" };
    const out = [{ x: stroke[0].x, y: stroke[0].y }]; let need = T.step;   // resampled every `step` tiles along the stroke
    for (let i = 1; i < stroke.length; i++) {
        const a = stroke[i - 1], b = stroke[i], seg = Math.hypot(b.x - a.x, b.y - a.y); let pos = 0;
        if (seg < 1e-9) continue;
        while (seg - pos >= need) { pos += need; out.push({ x: a.x + (b.x - a.x) * pos / seg, y: a.y + (b.y - a.y) * pos / seg }); need = T.step; }
        need -= seg - pos;
    }
    { const e = stroke[stroke.length - 1], l = out[out.length - 1]; if (Math.hypot(e.x - l.x, e.y - l.y) > 0.05) out.push({ x: e.x, y: e.y }); }
    const sm = out.map((p, i) => i === 0 || i === out.length - 1 ? p : { x: (out[i - 1].x + p.x + out[i + 1].x) / 3, y: (out[i - 1].y + p.y + out[i + 1].y) / 3 });   // (smoothed: a hand's wobble taken out, its curves kept)
    if (typeof facilityStandOk === "function" && !facilityStandOk(sm[0].x, sm[0].y)) return { ok: false, why: "START THE PATH ON THE FLOOR" };
    const pts = [sm[0]]; let L = 0;
    for (let i = 1; i < sm.length; i++) {
        const a = pts[pts.length - 1], b = sm[i], seg = Math.hypot(b.x - a.x, b.y - a.y);
        if ((typeof facilityStandOk === "function" && !facilityStandOk(b.x, b.y)) || (typeof facilityLosFrom === "function" && !facilityLosFrom(a.x, a.y, b.x, b.y))) break;   // (a wall cuts it: it ends here)
        if (L + seg >= T.maxLen) { const k = (T.maxLen - L) / seg; pts.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }); L = T.maxLen; break; }
        pts.push(b); L += seg;
    }
    if (L < T.minLen) return { ok: false, why: "THE PATH RUNS INTO A WALL" };
    if (f && typeof facilityLosFrom === "function" && !facilityLosFrom(f.x, f.y, pts[0].x, pts[0].y)) return { ok: false, why: "THE BURROWER CANNOT GET TO ITS START" };
    return { ok: true, pts, len: L };
}
function techFaultlineAt(tech, pts) {
    if (!Array.isArray(pts) || pts.length < 2) return { ok: false, why: "DRAW A PATH", again: true };
    const T = TECH_AB.fault, f0 = _techFrame(), cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const trace = { type: "faultTrace", x: pts[0].x, y: pts[0].y, pts, cum, by: tech, life: 1e6, maxLife: 1e6, reached: -1, done: false };   // (it glows until the run is over, then fades: techFaultStep)
    if (typeof elementEffects !== "undefined") elementEffects.push(trace);
    tech._fault = { pts, cum, phase: "dive", t0: f0, dive: T.dive, along: 0, nextSpike: 0, hit: [], trace };
    tech._abBusy = { kind: "fault" }; tech.job = null; tech.attackOrder = null; tech._shieldHold = null; tech._burrow = null;
    if (TECH_ABILITY2[tech.evolved] && TECH_ABILITY2[tech.evolved].ult) tech.ultimateCharge = 0; else tech._ab2ReadyAt = f0 + techCooldown(tech, T.cooldown);   // (the Ultimate's charge, spent as it goes under)
    _techSay("〰 FAULTLINE · " + _techName(tech) + " GOES UNDER", "#ff8a3a");
    return { ok: true };
}
function _faultAt(F, s) {   // the path's point `s` tiles along it
    const P = F.pts, C = F.cum; let i = 1;
    while (i < C.length - 1 && C[i] < s) i++;
    const a = P[i - 1], b = P[i], seg = (C[i] - C[i - 1]) || 1e-9, k = Math.max(0, Math.min(1, (s - C[i - 1]) / seg));
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
}
function _techFaultSpike(f, F, x, y) {
    const T = TECH_AB.fault, dmg = ((f.stats && f.stats.attack) || 5) * 0.25 * T.mult;
    for (const e of (typeof unitsNear === "function" ? unitsNear(x, T.hitR + 0.5) : actors)) {
        if (!_techFoeOk(e) || F.hit.indexOf(e) >= 0 || Math.hypot(e.x - x, e.y - y) > T.hitR) continue;
        F.hit.push(e);
        if (typeof applyElementalDamage === "function") applyElementalDamage(e, dmg, f, "fire", DMG_HIT_ALT); else if (typeof applyDamage === "function") applyDamage(e, dmg, f, "fire", false, false, DMG_HIT_ALT);
    }
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "faultSpike", x, y, life: 26, maxLife: 26 });
}
// a frame of a FAULTLINE (js/npc.js updateNPC, before the unit's own moves): true while it runs (nothing else moves it), false once it has surfaced
function techFaultStep(f) {
    const F = f._fault; if (!F) return false;
    const T = TECH_AB.fault, f0 = _techFrame();
    const end = () => { f._fault = null; if (f._abBusy && f._abBusy.kind === "fault") f._abBusy = null; f.untargetable = false; if (F.trace) { F.trace.done = true; F.trace.life = T.trace; F.trace.maxLife = T.trace; } return false; };
    if (f.dead || f._flight || f._launchLoad || f.returningToCrystal || f.retreatUntil > f0 || !_techMember(f)) return end();
    if (F.phase === "dive") { if (f0 - F.t0 >= F.dive) { F.phase = "to"; f.untargetable = true; } return true; }
    if (F.phase === "to") {   // under the floor to the path's start
        const p = F.pts[0], dx = p.x - f.x, dy = p.y - f.y, d = Math.hypot(dx, dy);
        if (d <= T.speed) { f.x = p.x; f.y = p.y; F.phase = "along"; return true; }
        const nx = f.x + dx / d * T.speed, ny = f.y + dy / d * T.speed;
        if (typeof facilityStandOk === "function" && !facilityStandOk(nx, ny)) return end();
        f.x = nx; f.y = ny; f.dirX = dx / d; f.dirY = dy / d;
        return true;
    }
    const total = F.cum[F.cum.length - 1], was = { x: f.x, y: f.y };   // along the path, a spike every `spacing` tiles as it passes
    F.along = Math.min(total, F.along + T.speed);
    const q = _faultAt(F, F.along); f.x = q.x; f.y = q.y;
    { const dx = q.x - was.x, dy = q.y - was.y, d = Math.hypot(dx, dy); if (d > 1e-6) { f.dirX = dx / d; f.dirY = dy / d; } }
    while (F.nextSpike <= F.along + 1e-9) { const sp = _faultAt(F, F.nextSpike); _techFaultSpike(f, F, sp.x, sp.y); F.nextSpike += T.spacing; }
    if (F.trace) F.trace.reached = F.along;
    if (F.along >= total - 1e-9) return end();
    return true;
}
// ── THE PATH AIM (FAULTLINE's): a press-drag-release on the floor, from js/input.js (the press, every move while it is down, the let-go; a cancelled touch) ──
function techAimPathStart(sx, sy) {
    const A = techAim; if (!A || techAimNeed() !== "path") return false;
    const p = techScreenToWorld(sx, sy); A.stroke = [{ x: p.x, y: p.y }]; A.drawing = true; A.full = false;
    return true;
}
function techAimPathMove(sx, sy) {
    const A = techAim; if (!A || !A.drawing || !A.stroke) return false;
    if (A.full) return true;
    const T = TECH_AB.fault, p = techScreenToWorld(sx, sy), q = A.stroke[A.stroke.length - 1], d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < 0.1) return true;
    const L = _faultLen(A.stroke);
    if (L + d >= T.maxLen) { const k = (T.maxLen - L) / d; A.stroke.push({ x: q.x + (p.x - q.x) * k, y: q.y + (p.y - q.y) * k }); A.full = true; return true; }   // (it stops growing at maxLen)
    A.stroke.push({ x: p.x, y: p.y });
    return true;
}
function techAimPathEnd(sx, sy) {
    const A = techAim; if (!A || !A.drawing) return false;
    techAimPathMove(sx, sy); A.drawing = false;
    const P = techFaultPath(A.f, A.stroke);
    if (!P.ok) { _techSay(P.why, "#ff8a6a"); A.stroke = null; A.full = false; return true; }   // (the aim stays up: draw it again)
    const r = techAbility2Use(A.f, { path: P.pts });
    if (!r.ok) { _techSay(r.why, "#ff8a6a"); A.stroke = null; A.full = false; return true; }
    techAimCancel(true);
    return true;
}
function techAimPathCancel() { if (techAim && techAimNeed() === "path") techAimCancel(); }
// the second chip on its squad card (js/party.js): { text, cls } or null; a tap on it aims FAULTLINE (again: calls it off)
function techChip2State(f) {
    const ab = techAbility2Of(f); if (!ab || ab.ult) return null;   // (FAULTLINE is the Ultimate now: no chip)
    if (techAim && techAim.f === f && techAim.ab === ab) return { text: "✕ AIMING", cls: "aim" };
    if (f._fault) return { text: ab.icon + " UNDER", cls: "busy" };
    if (f._abBusy || f._burrow) return { text: ab.icon + " BUSY", cls: "busy" };
    const w = techReady2In(f); if (w > 0) return { text: ab.icon + " " + Math.ceil(w / 60) + " S", cls: "wait" };
    return { text: ab.icon + " " + ab.short, cls: "ready" };
}
function techChip2Tap(f) {
    const ab = techAbility2Of(f); if (!ab) return false;
    if (techAim && techAim.f === f && techAim.ab === ab) { techAimCancel(); return false; }
    const c = techAbility2Can(f); if (!c.ok) { _techSay(c.why, "#ff8a6a"); return false; }
    techAim = { mode: "combat", f, ab: c.ab, site: null, step: 0, picks: {}, stroke: null, drawing: false, full: false }; _techAimShow();
    return true;
}
// its INFO section (js/unitinfo.js), beside the drill's
function techAbility2Info(f) {
    const ab = techAbility2Of(f); if (!ab || ab.ult) return null;   // (FAULTLINE: INFO lists it as the Ultimate, js/unitinfo.js)
    const T = TECH_AB.fault, w = techReady2In(f), ready = f._fault || f._abBusy ? "BUSY" : w > 0 ? "IN " + Math.ceil(w / 60) + " S" : _techMember(f) ? "NOW" : "IN THE SQUAD ONLY", hit = Math.round(((f.stats && f.stats.attack) || 5) * 0.25 * T.mult * 10) / 10;
    return { h: "ABILITY · " + ab.name, note: "From the " + ab.icon + " chip on its squad card, then press on the floor, draw its path and let go: it dives, follows the path under the floor, and molten spikes erupt along it. Each enemy on the path is hit once. The THERMITE DRILL keeps its own chip and its own wait.",
             rows: [["PATH", "up to " + T.maxLen + " tiles, at least " + T.minLen + "; it ends at a wall"], ["SPIKES", "every " + T.spacing + " tiles, " + hit + " each (fire), within " + T.hitR + " tiles"], ["COOLDOWN", Math.round(T.cooldown / 60) + " s, its own"], ["FIRST WAIT", Math.round(TECH_AB.joinWait / 60) + " s after it joins the squad"], ["READY", ready]] };
}
// the stroke while it is drawn (techDrawOverlay): a glowing line to the pen
function _techDrawFaultStroke(g, A, f0) {
    const S = A.stroke; if (!S || !S.length) return;
    g.save(); g.lineCap = "round"; g.lineJoin = "round";
    for (let pass = 0; pass < 2; pass++) {
        g.globalAlpha = pass ? 0.95 : 0.35 + 0.1 * Math.sin(f0 * 0.3); g.strokeStyle = pass ? "#ffd27a" : "#ff5a1f"; g.lineWidth = pass ? 2.5 : 9;
        g.beginPath(); for (let i = 0; i < S.length; i++) { const p = _techScr(S[i].x, S[i].y), y = p.y + TILE_H; if (i) g.lineTo(p.x, y); else g.moveTo(p.x, y); } g.stroke();
    }
    const e = _techScr(S[S.length - 1].x, S[S.length - 1].y); g.globalAlpha = 1; g.fillStyle = A.full ? "#ffffff" : "#ffd27a"; g.beginPath(); g.arc(e.x, e.y + TILE_H, 4, 0, Math.PI * 2); g.fill();
    g.restore();
}

// everything the abilities keep for a game, let go when a new one starts or one is loaded (js/facilityplay.js facilityResetState). Saved and put back by the facility's save: the launchers, the rubble, the clock and the pools.
function techReset() { if (techBridges.length && typeof facilityIceSet === "function") facilityIceSet([]); techBridges = []; techShields = []; techFrosts = []; techPools = []; techReefs = []; techClimbs = []; techClock = 0; techAim = null; _techLabels = {}; }

// ── the throw and the flight ──
function _techLoadPoint(a) {
    const L = a._launchLoad; if (!L) return null;
    if (L.kind === "site") { const s = _techSite(L.site); return s ? s.at : null; }
    return L.by && !L.by.dead ? [L.by.x, L.by.y] : null;
}
function _techCancel(a, why) {
    const L = a._launchLoad; a._launchLoad = null; a._fpWalkGoal = null;
    if (L && L.by && L.by._abBusy && L.by._abBusy.who === a) L.by._abBusy = null;
    if (why) _techSay(why, "#ff8a6a");
}
function _techFly(a, x1, y1, dur, peak, info) {
    const lift = typeof facilityLiftPx === "function" ? facilityLiftPx : () => 0;
    a._flight = Object.assign({ x0: a.x, y0: a.y, x1, y1, t0: _techFrame(), dur, peak, z0: lift(a.x, a.y), z1: lift(x1, y1) }, info);
    if (a === _techRider()) { a.fpPath = null; a.targetX = a.x; a.targetY = a.y; }   // you: the walk is over (js/facilityplay.js facilityPlayerStep flies you)
    else { a.job = null; a._fpPath = null; a._fpWalkGoal = null; a.state = "idle"; }
}
function _techThrow(a) {
    const L = a._launchLoad; a._launchLoad = null; a._fpWalkGoal = null; const T = TECH_AB.launch;
    if (L.kind === "site") { const s = _techSite(L.site); if (!s) return; _techFly(a, s.land[0], s.land[1], T.siteFlight, T.sitePeak, { kind: "site", site: s.id }); }
    else {
        const t = L.by, foe = L.foe, dx = t.x - foe.x, dy = t.y - foe.y, d = Math.hypot(dx, dy) || 1;
        let lx = foe.x + dx / d * 0.7, ly = foe.y + dy / d * 0.7;   // beside the enemy, on the thrower's side
        if (typeof facilityStandOk === "function" && !facilityStandOk(lx, ly) && typeof _fpNearestCell === "function") { const c = _fpNearestCell(lx, ly); if (c) { lx = c[0]; ly = c[1]; } }
        _techFly(a, lx, ly, T.flight, T.peak, { kind: "combat", by: t, foe });
        t._abBusy = null; t._abReadyAt = _techFrame() + techCooldown(t, T.cooldown);   // the cooldown starts as the follower leaves the ground
    }
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "ring", x: a.x, y: a.y, radius: 0.9, color: "#ffe733", life: 22 });
}
// a flying follower's step (js/npc.js updateNPC): nothing else moves it, and no wall stops it
function techFlightStep(a) {
    const F = a._flight; if (!F) return false;
    const t = Math.min(1, Math.max(0, (_techFrame() - F.t0) / F.dur));
    a.x = F.x0 + (F.x1 - F.x0) * t; a.y = F.y0 + (F.y1 - F.y0) * t; a.lastX = a.x; a.lastY = a.y;
    const dx = F.x1 - F.x0, dy = F.y1 - F.y0, d = Math.hypot(dx, dy); if (d > 1e-6) { a.dirX = dx / d; a.dirY = dy / d; }
    if (t >= 1) { a._flight = null; _techLand(a, F); }
    return true;
}
// how far above its floor a flying follower is drawn (px): its height eased from one end's floor to the other's, plus the arc
function techFlightLift(a) {
    const F = a && a._flight; if (!F) return 0;
    const t = Math.min(1, Math.max(0, (_techFrame() - F.t0) / F.dur)), here = typeof facilityLiftPx === "function" ? facilityLiftPx(a.x, a.y) : 0;
    return F.z0 + (F.z1 - F.z0) * t - here + F.peak * 4 * t * (1 - t);
}
function _techLand(a, F) {
    const T = TECH_AB.launch;
    if (F.kind === "combat") {
        const foe = F.foe, hit = !!foe && !foe.dead && Math.hypot(foe.x - a.x, foe.y - a.y) <= T.hitReach;
        if (hit) {
            if (typeof applyDamage === "function") applyDamage(foe, (a.power || 10) * T.powerMult, a, null, false, false, DMG_HIT_LAUNCH);   // (the landing: Earthquake, js/damage.js)
            if (!F.xpDone && F.by && !F.by.dead && typeof gainXp === "function" && typeof killXp === "function") { F.xpDone = true; gainXp(F.by, killXp(foe)); }   // a throw that hits: the technician's XP, once
            if (!foe.dead) a.attackOrder = { target: foe, until: _techFrame() + 600 };   // (it fights the one it was thrown at)
            if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: a.x, y: a.y, text: "⚡ KINETIC IMPACT", color: "#ffe733", life: 60, vy: -0.06, size: 12 });
        } else if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: a.x, y: a.y, text: "MISSED", color: "#8aa0c8", life: 50, vy: -0.06, size: 11 });
        if (typeof applyDamage === "function") applyDamage(a, T.selfDamage, null, null, false, true);   // the set amount, hit or miss: it comes down hard (fixed: no defense changes it; no hit takes more than the cap)
        if (typeof shake !== "undefined") shake = Math.max(shake || 0, hit ? 6 : 3);
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: a.x, y: a.y, color: "#ffe733", radius: 0.9, life: 24 });
    } else if (F.kind === "site") {
        const s = _techSite(F.site), where = s ? String(s.label || s.to).toUpperCase() : "";
        if (F.rider || a === _techRider()) { a.fpPath = null; a.targetX = a.x; a.targetY = a.y; if (s) _techSay("⚡ YOU ARE ON THE " + where + (_techLedgeFrom(a.x, a.y) ? " · ITS LEDGE (▼) IS THE WAY BACK DOWN" : ""), "#ffe733"); }   // you, carried over
        else if (s && s.pocket) { a._pocketHold = s.id; _techSay("⚡ " + _techName(a) + " IS ON THE " + where + " · IT WAITS THERE FOR YOU" + (_techLedgeFrom(a.x, a.y) ? " · COME BRINGS IT DOWN THE LEDGE" : " UNTIL THE WAY IS OPEN"), "#ffe733"); }   // a pocket: it stays in the squad and waits there (techStepOverride) until you are up there too, the way is open, or it is called
        else {
            if (s && typeof partyPost === "function") partyPost(a, s.to, true);   // it holds the room up there until it is called back
            if (s) _techSay("⚡ " + _techName(a) + " IS ON THE " + where + " · COME BRINGS IT BACK", "#ffe733");
        }
    } else if (F.kind === "drop" && a === _techRider()) { a.fpPath = null; a.targetX = a.x; a.targetY = a.y; }   // you, down on the ledge again
    else if (F.kind === "climb" && a === _techRider()) {   // you, over a REEF climb: you step off its end before it takes you back
        a.fpPath = null; a.targetX = a.x; a.targetY = a.y; a._climbHold = true;
        const C = _techClimb(F.climb); if (C) _techSay(F.up ? "◆ YOU CLIMB UP ONTO THE " + _techClimbName(C) + (_techLedgeFrom(a.x, a.y) ? " · ITS LEDGE (▼) OR THE REEF TAKES YOU BACK DOWN" : " · THE REEF TAKES YOU BACK DOWN") : "◆ YOU CLIMB DOWN THE REEF", "#ff7ab8");
    }
    if (typeof elementEffects !== "undefined" && F.kind !== "combat") elementEffects.push({ type: "ring", x: a.x, y: a.y, radius: 0.7, color: F.kind === "climb" ? "#ff7ab8" : "#ffe733", life: 18 });
}

// ── a follower walking to the launcher, to a site it is setting up, or to a ledge (js/npc.js updateRTSNPC asks first): true when this moved it ──
function techStepWants(a) { return !!(a && (a._launchLoad || a._siteWork || a._dropSite || a._climbGo || a._shieldHold || a._drill || a._blight || a._pocketHold)); }
// a follower thrown onto a POCKET site's landing (a cut-off part of its room: the Sewers' collapsed tunnel) waits where it landed until the player is on that stretch too (rode over, or the choke was drilled and the floors are
// one), or it is ordered elsewhere (an attack, a retreat, a post; COME clears the hold itself: js/commandcenter.js); then it follows as before, and without the player up there it jumps from the ledge (_techDropScan)
function _techPocketTick(f) {
    const s = _techSite(f._pocketHold); if (!s) { f._pocketHold = null; return; }
    const pc = _techComp(player.x, player.y), lc = _techComp(s.land[0], s.land[1]), fc = _techComp(f.x, f.y);
    if (lc === undefined || lc === pc || fc !== lc || f.dead || f.returningToCrystal || f.post || f.attackOrder || f.retreatUntil > _techFrame()) { f._pocketHold = null; f._fpWalkGoal = null; }
}
function _techFace(a, x, y) { const dx = x - a.x, dy = y - a.y, d = Math.hypot(dx, dy); if (d > 1e-6) { a.dirX = dx / d; a.dirY = dy / d; } }
function techStepOverride(a) {
    let pt = null;
    if (a._launchLoad) pt = _techLoadPoint(a);
    else if (a._siteWork) { const s = _techSite(a._siteWork.site); if (s) { if (a._siteWork.workAt !== null) { a._fpWalkGoal = null; return true; } pt = s.at; } }   // (at work: it stands still)
    else if (a._dropSite) { const L = _techLedge(a._dropSite); if (L) pt = L.at; }
    else if (a._climbGo) { const E = _techClimbEnd(_techClimb(a._climbGo), a.x, a.y); if (E) pt = E.at; }   // to a REEF climb's end, to go over it to you
    else if (a._shieldHold) {   // behind its Photonic Shield: it holds its spot, and fights back only what comes right up to it
        const H = a._shieldHold;
        let foe = null, fd = 1.0; for (const e of (typeof unitsNear === "function" ? unitsNear(a.x, 1.2) : actors)) { if (!_techFoeOk(e)) continue; const d = Math.hypot(e.x - a.x, e.y - a.y); if (d < fd) { fd = d; foe = e; } }
        if (foe && typeof followerAttack === "function") { a._fpWalkGoal = null; followerAttack(a, foe); return true; }
        if (Math.hypot(H.x - a.x, H.y - a.y) < 0.25) { a._fpWalkGoal = null; return true; }   // (there: it holds)
        pt = [H.x, H.y];
    }
    else if (a._drill) {   // to the rubble's work spot (then it stands and drills), or after the enemy it drills, keeping it in reach
        const W = a._drill;
        if (W.rubble) { const r = _techRubble(W.rubble); if (r) { if (W.workAt !== null) { a._fpWalkGoal = null; _techFace(a, r.at[0], r.at[1]); return true; } pt = r.work; } }
        else if (W.foe && !W.foe.dead) { if (Math.hypot(W.foe.x - a.x, W.foe.y - a.y) <= TECH_AB.drill.reach * 0.85) { a._fpWalkGoal = null; _techFace(a, W.foe.x, W.foe.y); return true; } pt = [W.foe.x, W.foe.y]; }
    }
    else if (a._blight) pt = [a._blight.x, a._blight.y];   // the Blight Spider, to where it leaves its pool
    else if (a._pocketHold) { const s = _techSite(a._pocketHold); if (s) { if (Math.hypot(s.land[0] - a.x, s.land[1] - a.y) < 0.3) { a._fpWalkGoal = null; return true; } pt = s.land; } }   // in a pocket: it waits where it landed
    if (!pt) { a._fpWalkGoal = null; return false; }
    a._fpWalkGoal = { x: pt[0], y: pt[1] };   // (the facility's routing walks it round walls to here: js/facilityplay.js _fpGoals)
    const dx = pt[0] - a.x, dy = pt[1] - a.y, d = Math.hypot(dx, dy);
    if (d > 0.05 && typeof _walkStep === "function") _walkStep(a, dx, dy, d);
    return true;
}

// ── each frame (js/game.js): first waits, throws, set-ups, the ledges, the sites' notices ──
function techAbilityTick() {
    if (typeof _fp === "undefined" || !_fp || typeof followers === "undefined") return;
    const f0 = _techFrame(), T = TECH_AB.launch;
    for (const f of followers) {
        if (!f || f.dead) continue;
        const m = !!techAbilityOf(f) && _techMember(f);
        if (m && !f._abMember) { f._abReadyAt = Math.max(f._abReadyAt || 0, f0 + TECH_AB.joinWait); if (techAbility2Of(f)) f._ab2ReadyAt = Math.max(f._ab2ReadyAt || 0, f0 + TECH_AB.joinWait); }   // it has just joined the squad: the first wait (FAULTLINE's too)
        f._abMember = m;
        if (f._abBusy && f._abBusy.kind === "combat" && (!f._abBusy.who || f._abBusy.who.dead || !f._abBusy.who._launchLoad)) f._abBusy = null;   // (the follower it was throwing is gone)
        const L = f._launchLoad;
        if (L) {
            const pt = _techLoadPoint(f), by = L.by;
            if (!pt || f.returningToCrystal) _techCancel(f, "THE THROW IS OFF");
            else if (L.kind === "combat" && (!L.foe || L.foe.dead || !by || by.dead || !_techMember(by))) _techCancel(f, L.foe && L.foe.dead ? null : "THE THROW IS OFF");
            else if (f0 - L.t0 > T.loadWait) _techCancel(f, "THE THROW IS OFF · " + _techName(f) + " COULD NOT GET THERE");
            else if (Math.hypot(pt[0] - f.x, pt[1] - f.y) <= T.loadReach) _techThrow(f);
        }
        const W = f._siteWork;
        if (W) {
            const s = _techSite(W.site);
            if (!s || f.returningToCrystal || !_techMember(f) || (W.workAt === null && f0 - W.t0 > T.setupWalk)) { f._siteWork = null; f._abBusy = null; f._fpWalkGoal = null; _techSay("THE LAUNCHER IS NOT SET UP", "#ff8a6a"); }
            else if (W.workAt === null) { if (Math.hypot(s.at[0] - f.x, s.at[1] - f.y) <= 1.0) W.workAt = f0; }
            else if (f0 - W.workAt >= T.setup) {
                f._siteWork = null; f._abBusy = null; f._fpWalkGoal = null;
                if (!techLauncherAt(s.id)) { _techInstalled().add(s.id); if (typeof gainXp === "function") gainXp(f, T.siteXp); }   // set up for good; its XP once (a site takes one launcher)
                _techSay("⚡ KINETIC LAUNCHER SET UP · " + String(s.label || s.id).toUpperCase(), "#ffe733");
                if (typeof elementEffects !== "undefined") elementEffects.push({ type: "ring", x: s.at[0], y: s.at[1], radius: 1.4, color: "#ffe733", life: 36 });
            }
        }
        if (f._dropSite && !f._flight) {   // at the ledge: it jumps down
            const L = _techLedge(f._dropSite);
            if (!L) f._dropSite = null;
            else if (Math.hypot(L.at[0] - f.x, L.at[1] - f.y) <= 0.5) { f._dropSite = null; f._fpWalkGoal = null; _techFly(f, L.to[0], L.to[1], T.dropFlight, 14, { kind: "drop", ledge: L.id }); }
        }
        if (f._climbGo && !f._flight) {   // at a REEF climb's end: it goes over it
            const C = _techClimb(f._climbGo), E = _techClimbEnd(C, f.x, f.y);
            if (!E) f._climbGo = null;
            else if (Math.hypot(E.at[0] - f.x, E.at[1] - f.y) <= 0.5) { f._climbGo = null; f._fpWalkGoal = null; _techFly(f, E.to[0], E.to[1], TECH_AB.reef.flight, TECH_AB.reef.peak, { kind: "climb", climb: C.id, up: E.up }); }
        }
        if (f._drill) _techDrillTick(f, f0);
        if (f._blight) _techBlightWalkTick(f, f0);
        if (f._pocketHold) _techPocketTick(f);
    }
    _techRiderTick(f0);   // you, to a launcher's pad or a ledge
    if (f0 % 15 === 3) _techDropScan();
    _techSiteNotices(); _techRubbleNotices();
    _techShieldTick();
    techClock++;   // THE PLAY CLOCK: a frame of play
    _techFrostTick(f0); _techBridgeTick(f0); _techPoolTick(); _techReefTick(f0);
}
// THE LEDGES: a follower up on a raised floor with a ledge (the catwalks) that is not holding it (it was called back), and is up there without you, walks onto the ledge and jumps down; one posted to a site's room that is not
// up there (it came back from the dead at the Crystal) is let go of its post, since nobody walks up. A POCKET site's landing (the Sewers' sample bank) has no ledge: its way out is the passage its rubble opens, or the pipe.
// A REEF CLIMB (build 2026-11-08m) is a way between two stretches both ways: a follower on another stretch from you, with a climb from its stretch to yours, goes over it to you (the ledge or the climb,
// whichever is nearer, when both would take it down).
function _techDropScan() {
    const sites = _techSites(), ledges = _techLedges(); if (!sites.length && !ledges.length && !techClimbs.length) return;
    const pc = _techComp(player.x, player.y);
    for (const f of followers) {
        if (!f || f.dead || f.isClone || f._flight || f._launchLoad || f._siteWork) continue;
        const fc = _techComp(f.x, f.y); f._dropSite = null; f._climbGo = null; let freed = false;
        for (const s of sites) {
            const sc = _techComp(s.land[0], s.land[1]); if (sc === undefined) continue;
            if (!s.pocket && f.post === s.to && fc !== sc) { if (typeof partyCall === "function" && !partyCall(f, true) && typeof partyPost === "function" && typeof partyRoomOf === "function") partyPost(f, partyRoomOf(f), true); freed = true; break; }   // (a pocket is no post: its room is the follower's own)
        }
        if (freed || fc === pc || f.post || f.job || f.returningToCrystal || f._pocketHold) continue;
        const L = _techLedgeFrom(f.x, f.y), W = techClimbs.length ? _techClimbTo(f.x, f.y, pc) : null;
        const dl = L ? Math.hypot(L.at[0] - f.x, L.at[1] - f.y) : Infinity, dw = W ? Math.hypot(W.E.at[0] - f.x, W.E.at[1] - f.y) : Infinity;
        if (W && dw <= dl) f._climbGo = W.c.id; else if (L) f._dropSite = L.id;
    }
}
function _techSiteNotices() {
    if (typeof player === "undefined") return;
    if (!_fp.siteNear) _fp.siteNear = new Set();
    for (const s of _techSites()) {
        const near = Math.hypot(s.at[0] - player.x, s.at[1] - player.y) <= TECH_AB.launch.near;
        if (near) _fp.siteNear.add(s.id); else _fp.siteNear.delete(s.id);   // (ASKED: "it should remain subtle and uninterruptive": nothing is said as you come near; its small tag is all)
    }
}

// ── AIMING: an ability waiting for the player to pick its targets (the prompt over the screen says what to tap; a tap on its chip again, ✕ or Escape calls it off) ──
let techAim = null;   // { mode: "combat" | "site", f, ab, site, step, picks } (+ stroke for a path; + flux for FLUX MOVE: { s, turn, at, grid })
let _techLabels = {};  // where each site's label was drawn last (a tap on it is a tap on the site): drawing's, not the game's state
function techAimActive() { return !!techAim; }
function techAimNeed() { const A = techAim; if (!A) return null; return A.mode === "site" ? "follower" : A.ab.aim[A.step] || null; }
function techAimPrompt() {
    const A = techAim; if (!A) return "";
    if (A.mode === "site") { const s = _techSite(A.site); return "KINETIC LAUNCHER · " + (s && s.rider ? "TAP ITS TAG AGAIN TO RIDE IT · OR A FOLLOWER TO SEND OVER TO THE " : s && s.pocket ? "TAP " + _techOnlyName(s) + " TO SEND INTO THE " : "TAP A FOLLOWER TO SEND UP TO THE ") + String(s ? s.label || s.to : "").toUpperCase(); }
    const need = techAimNeed();
    if (A.flux) {   // FLUX MOVE: what to do next, as it goes
        if (!A.flux.s) return "FLUX MOVE · TAP AN OBJECT TO MOVE: THE OUTLINED ONES";
        return "FLUX MOVE · THE " + _fluxName(A.flux.s) + (A.flux.at ? " · ✓ PLACE IT" : " · TAP WHERE IT GOES");   // (short: ⟳ ROTATE and ✓ PLACE stand beside it)
    }
    return A.ab.name + " · " + (need && A.ab.ask ? A.ab.ask(need, A.picks) : "");
}
function _techAimShow() {
    if (typeof document === "undefined" || !document.body || !document.body.classList) return;
    document.body.classList.toggle("tech-aiming", !!techAim);
    const X = techAim && techAim.flux;   // FLUX MOVE's buttons in the prompt: ✓ PLACE once an object is picked, ⟳ ROTATE for one that turns
    document.body.classList.toggle("tech-flux-place", !!(X && X.s));
    document.body.classList.toggle("tech-flux-turn", !!(X && X.s && typeof fluxCanTurn === "function" && fluxCanTurn(X.s)));
    const el = document.getElementById ? document.getElementById("techAim") : null, t = el && el.querySelector ? el.querySelector(".ta-t") : null;
    if (t) t.textContent = techAimPrompt();
    if (typeof partyBarRender === "function") partyBarRender(true);
}
// the chip on a technician's squad card (js/party.js)
function techChipTap(f) {
    if (techAim && techAim.f === f && techAim.ab === techAbilityOf(f)) { techAimCancel(); return false; }   // (its own aim again calls it off; FAULTLINE's aim is its other chip's, and this one takes its place)
    const c = techAbilityCan(f); if (!c.ok) { _techSay(c.why, "#ff8a6a"); return false; }
    techAim = { mode: "combat", f, ab: c.ab, site: null, step: 0, picks: {} };
    if (c.ab.id === "flux_move") techAim.flux = { s: null, turn: false, at: null, grid: [null, null] };   // (FLUX MOVE: the object and its place are kept here, in the aim, until ✓ PLACE)
    _techAimShow();
    return true;
}
function techAimCancel(quiet) { if (!techAim) return; techAim = null; _techAimShow(); if (!quiet) _techSay("CALLED OFF", "#8aa0c8"); }
function techAimPickFollower(g) {
    const A = techAim; if (!A) return false;
    if (techAimNeed() !== "follower") return false;
    if (A.mode === "site") { const r = techSiteLaunch(_techSite(A.site), g); if (!r.ok) { _techSay(r.why, "#ff8a6a"); return true; } techAimCancel(true); return true; }
    if (!_techThrowable(g, A.f)) { _techSay(g === A.f ? "IT CANNOT THROW ITSELF · PICK ANOTHER FOLLOWER" : "PICK ANOTHER FOLLOWER", "#ff8a6a"); return true; }
    A.picks.follower = g; A.step++; _techAimShow();
    return true;
}
// the last pick of an aim (an enemy, a spot, FLUX MOVE's place): the ability is used; one that can be picked again (out of sight, not floor, a place refused) keeps the aim up
function _techAimLast(kind, v) {
    const A = techAim; if (!A || techAimNeed() !== kind) return false;
    A.picks[kind] = v; const r = techAbilityUse(A.f, A.picks);
    if (!r.ok) { _techSay(r.why, "#ff8a6a"); if (r.again || r.why === "THE TECHNICIAN CANNOT SEE IT" || r.why === "PICK AN ENEMY") { A.picks[kind] = null; return true; } }   // (another can be picked)
    techAimCancel(true);
    return true;
}
function techAimPickEnemy(e) { return _techAimLast("enemy", e); }
function techAimPickSpot(p) { return _techAimLast("spot", p); }
// the floor under a point on the screen (as a tap walks the player there: js/input.js handleInput), not rounded to a tile
function techScreenToWorld(ex, ey) {
    const dx = ex - canvas.width / 2, dy = ey + (typeof facilityPickLift === "function" ? facilityPickLift(ex, ey) : 0) - canvas.height / 2 - TILE_H;
    return { x: (dy / TILE_H + dx / TILE_W) / 2 + player.visualX, y: (dy / TILE_H - dx / TILE_W) / 2 + player.visualY };
}
// a tap on the world while aiming (js/input.js asks first): always the aim's
function techAimTap(x, y) {
    if (!techAim) return false;
    const need = techAimNeed();
    if (need === "follower") {
        const g = typeof findFollowerAtScreen === "function" ? findFollowerAtScreen(x, y) : null; if (g && !g.isClone) return techAimPickFollower(g);
        if (techAim.mode === "site") { const s = _techSite(techAim.site); techAimCancel(true); if (s && s.rider && _techOnLabel(s.id, x, y)) { const r = techSiteRide(s); if (!r.ok) _techSay(r.why, "#ff8a6a"); return true; } return false; }   // (the launcher's aim never holds you: a tap elsewhere puts it away and walks, js/input.js; its own tag again: you ride it)
        _techSay("TAP A FOLLOWER", "#8aa0c8"); return true;
    }
    if (need === "enemy") { const e = typeof findEnemyAtScreen === "function" ? findEnemyAtScreen(x, y) : null; if (e) return techAimPickEnemy(e); _techSay("TAP AN ENEMY", "#8aa0c8"); return true; }
    if (need === "spot") return techAimPickSpot(techScreenToWorld(x, y));
    if (need === "object") return techFluxPick(typeof fluxPropAtScreen === "function" ? fluxPropAtScreen(x, y) : null);   // FLUX MOVE: the object
    if (need === "place") {   // FLUX MOVE: its place (a tap on another movable object, off the reach, picks that one instead)
        const t = fluxTileAtScreen(x, y), A = techAim, R = A.flux.s ? fluxRegion(A.flux.s) : null;
        if (t && R && !R.has(t[0] + "," + t[1])) { const o = fluxPropAtScreen(x, y); if (o && o !== A.flux.s && fluxMovable(o)) return techFluxPick(o); }
        return t ? techFluxTile(t[0], t[1]) : true;
    }
    if (need === "path") { if (!techAimPathEnd(x, y)) _techSay("PRESS ON THE FLOOR AND DRAW ITS PATH", "#8aa0c8"); return true; }   // (FAULTLINE: the let-go ends the stroke)
    return true;
}
// is a point of the screen on a tag drawn last frame (a site's: its id; a ledge's: "ledge:" + its id)
function _techOnLabel(key, ex, ey) { const lr = _techLabels[key]; return !!lr && ex >= lr.x && ex <= lr.x + lr.w && ey >= lr.y && ey <= lr.y + lr.h; }
// a tap on a site (js/input.js handleInput): set a launcher up there, send a follower up from the one there, or (its tag again, with its aim up) ride it yourself; a tap on a ledge's tag: jump down. True when it was a site's
function techSiteTap(ex, ey) {
    if (typeof _fp === "undefined" || !_fp || typeof player === "undefined") return false;
    for (const L of _techLedges()) if (_techOnLabel("ledge:" + L.id, ex, ey)) { const r = techLedgeJump(L); if (!r.ok) _techSay(r.why, "#ff8a6a"); return true; }   // a ledge's tag (▼ LEDGE): you jump down from it
    for (const C of techClimbs) if (_techOnLabel("climb:" + C.id, ex, ey)) { const r = techClimbGo(C); if (!r.ok) _techSay(r.why, "#ff8a6a"); return true; }   // a REEF climb's tag: you go over it
    for (const s of _techSites()) {
        const nearAt = Math.hypot(s.at[0] - player.visualX, s.at[1] - player.visualY) <= TECH_AB.launch.near;
        if (!nearAt || !_techOnLabel(s.id, ex, ey)) continue;   // (only its tag takes a tap: a tap on the floor round it, to walk past, is a walk)
        if (techLauncherAt(s.id)) {
            if (_techSiteBusy(s)) { _techSay("THE LAUNCHER IS IN USE", "#ff8a6a"); return true; }
            if (s.rider && techAim && techAim.mode === "site" && techAim.site === s.id) { techAimCancel(true); const r = techSiteRide(s); if (!r.ok) _techSay(r.why, "#ff8a6a"); return true; }   // (its tag again, with its aim up: you ride it)
            techAim = { mode: "site", f: null, ab: TECH_ABILITIES.electric, site: s.id, step: 0, picks: {} }; _techAimShow();
            return true;
        }
        const r = techSiteSetup(s);
        _techSay(r.ok ? "⚡ " + _techName(r.tech) + " IS SETTING UP A KINETIC LAUNCHER" : r.why, r.ok ? "#ffe733" : "#ff8a6a");
        return true;
    }
    return false;
}
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => { if (e && e.key === "Escape" && techAim) techAimCancel(); else if (e && techAim && techAim.flux) _techFluxKey(e); }); } catch (e) { /* no window: the tests */ }
// FLUX MOVE's keys, while an object is picked: R turns it, Enter places it (the prompt's ⟳ ROTATE and ✓ PLACE); not while typing, and not while a line of dialogue is up (it takes Enter: js/dialogue.js)
function _techFluxKey(e) {
    if (!techAim.flux.s || e.repeat || (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName || "")) || (typeof _dlgCur !== "undefined" && _dlgCur)) return;
    if (e.key === "r" || e.key === "R") { techFluxRotate(); e.preventDefault(); }
    else if (e.key === "Enter") { techFluxPlace(); e.preventDefault(); }
}

// ── the chip on a technician's squad card (js/party.js partySlotsUpdate): { text, cls } or null ──
function techChipState(f) {
    const ab = techAbilityOf(f); if (!ab) return null;
    const ic = ab.icon || "⚡";
    if (techAim && techAim.f === f && techAim.ab === ab) return { text: "✕ AIMING", cls: "aim" };
    if (f._abBusy) return { text: ic + " " + ({ setup: "SETTING UP", combat: "THROWING", drill: "DRILLING", blight: "PLACING" }[f._abBusy.kind] || "BUSY"), cls: "busy" };
    const w = techReadyIn(f); if (w > 0) return { text: ic + " " + Math.ceil(w / 60) + " S", cls: "wait" };
    return { text: ic + " " + ab.short, cls: "ready" };
}

// ── the INFO card's ABILITY section (js/unitinfo.js): what it does, its numbers (the provisional ones too), and when it is ready ──
function techAbilityInfo(f) {
    const ab = techAbilityOf(f); if (!ab) return null;
    const w = techReadyIn(f), ready = f._abBusy ? "BUSY" : w > 0 ? "IN " + Math.ceil(w / 60) + " S" : _techMember(f) ? "NOW" : "IN THE SQUAD ONLY";
    if (ab.id === "kinetic_launcher") {
        const T = TECH_AB.launch;
        return { h: "ABILITY · " + ab.name, note: "From the ⚡ chip on its squad card: throw a follower at an enemy it can see. At a launcher site it sets a launcher up for good, which sends followers up to where nobody can walk (the Arena Catwalk); the one at the Sewers' collapsed tunnel carries you too (tap its tag twice).",
                 rows: [["DAMAGE", T.powerMult + "× the thrown follower's power"], ["THE THROWN FOLLOWER TAKES", String(T.selfDamage)], ["COOLDOWN", Math.round(T.cooldown / 60) + " s"], ["FIRST WAIT", Math.round(TECH_AB.joinWait / 60) + " s after it joins the squad"], ["READY", ready]] };
    }
    if (ab.id === "photonic_shield") {
        const S = TECH_AB.shield;
        return { h: "ABILITY · " + ab.name, note: "From the ◈ chip on its squad card: a wall of light between it and a creature it can see. Enemies cannot walk through it, nor bite, spit or strike across it; your side walks and shoots through. It holds " + S.back + " tiles behind it.",
                 rows: [["WIDTH", S.width + " tiles"], ["LASTS", Math.round(S.life / 60) + " s exactly"], ["COOLDOWN", Math.round(S.cooldown / 60) + " s"], ["FIRST WAIT", Math.round(TECH_AB.joinWait / 60) + " s after it joins the squad"], ["READY", ready]] };
    }
    const wait = [["COOLDOWN", "60 s"], ["FIRST WAIT", Math.round(TECH_AB.joinWait / 60) + " s after it joins the squad"], ["READY", ready]];
    if (ab.id === "thermite_drill") {
        const D = TECH_AB.drill, hit = Math.round(((f.stats && f.stats.attack) || 5) * 0.25 * D.foeMult * 10) / 10;
        wait[0][1] = Math.round(D.cooldown / 60) + " s, from its first hit";
        return { h: "ABILITY · " + ab.name, note: "Press and hold rubble in the rock and pick THERMITE DRILL: it walks over and drills it through. From the ✹ chip on its squad card: it drills an enemy it can see.",
                 rows: [["RUBBLE", D.hits + " hits, one a second"], ["AN ENEMY", D.foeHits + " hits, one a second, " + hit + " each (fire)"]].concat(wait) };
    }
    if (ab.id === "frost_patch") {
        const R = TECH_AB.frost;
        return { h: "ABILITY · " + ab.name, note: "From the ❄ chip on its squad card: on a spot of floor it can see, a patch of ice, there at once (enemies on it are slowed; your units cross it faster). On water it can see, an ICE BRIDGE: straight across, bank to bank, that anyone can walk on until it thaws.",
                 rows: [["PATCH", R.size + " × " + R.size + " tiles, " + Math.round(R.life / 60) + " s"], ["ENEMIES ON IT", Math.round(R.slow * 100) + "% of their speed"], ["YOUR UNITS ON IT", Math.round(R.boost * 100) + "% of their speed"], ["BRIDGE", R.bridgeWide + " tiles wide, up to " + R.bridgeMax + " tiles of water, standing until its next one"]].concat(wait) };
    }
    if (ab.id === "blight_spider") {
        const B = TECH_AB.blight, bite = Math.round(((f.stats && f.stats.specialAttack) || 10) * 0.12 * 0.3 * 100) / 100;
        return { h: "ABILITY · " + ab.name, note: "From the ☣ chip on its squad card: it walks to a spot of floor it can see and sets down a toxic pod. The pod's field hurts enemies standing in it, and the pod runs down: its field weaker and smaller until it is gone.",
                 rows: [["FIELD", B.size + " tiles across; up to " + B.max + " pods (a new one takes the oldest's place)"], ["RUNS DOWN IN", Math.round(B.life / 3600) + " min of play"], ["BITE", bite + " every " + (B.every / 60) + " s, fading as it runs down"], ["PODS NOW", String(techPools.length)]].concat(wait) };
    }
    if (ab.id === "reef") {
        const R = TECH_AB.reef, mine = techClimbs.find(c => c.by === f);
        wait[0][1] = Math.round(R.cooldown / 60) + " s, an outcrop or a climb";
        return { h: "ABILITY · " + ab.name, note: "From the ◆ chip on its squad card: it fires little shards, and rock and crystal grow where they land. On a spot of floor it can see: an outcrop that enemies cannot pass, mending your followers beside it. On high ground across an edge from it: a climb up the edge's face that you and your followers go up and back down, standing until its next one (not through glass, not from an ice bridge).",
                 rows: [["OUTCROP", Math.round(R.life / 60) + " s, " + Math.round(R.radius * 2 * 10) / 10 + " tiles across"], ["MENDS", Math.round(R.mend * 100) + "% of a follower's health every " + (R.every / 60) + " s, within " + R.mendReach + " tiles of it"], ["CLIMB", mine ? "up to the " + _techClimbName(mine) : "none standing"]].concat(wait) };
    }
    if (ab.id === "flux_move") {
        wait[0][1] = Math.round(TECH_AB.flux.cooldown / 60) + " s, from when it is placed";
        return { h: "ABILITY · " + ab.name, note: "From the ✦ chip on its squad card: tap an object on the screen (the ones that move are outlined), tap where it goes on its grid, and ✓ PLACE. A barrier can be turned (⟳ ROTATE). Nothing moves until it is placed; ✕ CALL OFF leaves it where it was.",
                 rows: [["REACH", "2 tiles from where it stands, any way (a diagonal counts as one)"], ["OBJECTS", typeof fluxLabOn === "function" && fluxLabOn() ? "the arena's and the test room's loose crates, barrels and barriers" : "the arena's loose crates, barrels and barriers"], ["IT MAY NOT", "go under anyone, onto a doorway or an item, or shut a way through"]].concat(wait) };
    }
    return { h: "ABILITY · " + ab.name, note: "", rows: [["READY", ready]] };
}

// ── drawing ──
function _techScr(x, y) { return { x: (x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, y: (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 - (typeof facilityLiftRel === "function" ? facilityLiftRel(x, y) : 0) }; }
// a point on a flight's arc, on the screen (`z0`/`z1`: the floors' heights at its ends, px; `peak`: the arc's height)
function _techArcScr(x0, y0, x1, y1, z0, z1, peak, t) {
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, cam = typeof _fpCam !== "undefined" ? _fpCam : 0;
    return { x: (x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, y: (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 - (z0 + (z1 - z0) * t - cam) - peak * 4 * t * (1 - t) };
}
// ── THE RUBBLE, AND THE HOLE IT LEAVES: drawn on the face of the room's edge like its decor (js/facilitydecor.js FP_WALL_KINDS.rubble asks this), u along the stretch, z px up from the floor ──
// Broken rock lighter than the cliff round it, a cracked slab with hazard paint across it and seams that glow as it is drilled; boulders fall away with each hit. Drilled through: a dark hole, scorched round its mouth.
const _TECH_RUBBLE = [[0.2, 0, 0.2, 22], [0.44, 0, 0.24, 26], [0.7, 0, 0.22, 24], [0.88, 0, 0.14, 16], [0.31, 17, 0.2, 22], [0.57, 19, 0.22, 24], [0.79, 15, 0.16, 18], [0.43, 36, 0.2, 20], [0.63, 38, 0.15, 16]];
function techDrawRubbleOn(it, f) {
    if (typeof _fpWP !== "function" || typeof ctx === "undefined") return;
    const r = _techRubble(it.rubble); if (!r) return;
    const len = Math.hypot(it.b[0] - it.a[0], it.b[1] - it.a[1]), segs = Math.max(1, Math.round(len / 2));   // a long choke (the Sewers' six-tile mouth) is the pile over and over, two tiles to a pile, each a little its own
    const polyW = (P, pts, fill, stroke, lw) => { ctx.beginPath(); pts.forEach((q, i) => { const p = P(q[0], q[1]); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.lineJoin = "round"; ctx.stroke(); } };
    const PW = (u, z) => _fpWP(it, u, z), poly = (pts, fill, stroke, lw) => polyW(PW, pts, fill, stroke, lw);   // (u over the whole stretch)
    ctx.save();
    if (techRubbleOpen(r) && r.solid) {   // A CHOKE drilled through: the passage behind it is open floor now, so only what is left of the pile is drawn: stones at the foot of each side (and where the piles met), scorched
        for (const [u, z, w] of [[0.1, 0, 0.1], [0.19, 0, 0.07], [0.9, 0, 0.11], [0.8, 0, 0.06], [0.14, 8, 0.06], [0.87, 7, 0.07]].map(([u, z, w]) => [u < 0.5 ? u / segs : 1 - (1 - u) / segs, z, w / segs])) poly([[u - w / 2, z], [u - w / 3, z + 8], [u + w / 3, z + 9], [u + w / 2, z]], "#6a5848", "#0b2a2f", 2);
        for (let sg = 1; sg < segs; sg++) for (const [du, w] of [[-0.04, 0.05], [0.05, 0.035]]) { const u = (sg + du) / segs, hw = w / segs; poly([[u - hw / 2, 0], [u - hw / 3, 7], [u + hw / 3, 8], [u + hw / 2, 0]], "#6a5848", "#0b2a2f", 2); }
        ctx.globalAlpha = 0.3 + 0.1 * Math.sin(f * 0.03); for (const u of [0.06 / segs, 1 - 0.06 / segs]) poly([[u - 0.05 / segs, 0], [u, 16], [u + 0.05 / segs, 0]], "#ff7a2a", null); ctx.globalAlpha = 1;   // the sides still warm
        ctx.restore(); return;
    }
    if (techRubbleOpen(r)) {   // THE HOLE: a black arch going back into the rock, rings of dark inside it, scorched round the mouth, a few stones at its foot
        const arch = (u0, u1, z1, inset) => { const pts = [[u0, inset]]; for (let k = 0; k <= 10; k++) { const t = k / 10, a = Math.PI * t; pts.push([(u0 + u1) / 2 - Math.cos(a) * (u1 - u0) / 2, z1 * 0.55 + Math.sin(a) * z1 * 0.45]); } pts.push([u1, inset]); return pts; };
        poly(arch(0.14, 0.86, 60, 0), "#3a2414", null); poly(arch(0.18, 0.82, 55, 0), "#1a0f08", null);   // the scorch round the mouth
        poly(arch(0.22, 0.78, 50, 0), "#050506", "#0b2a2f", 2.5);
        poly(arch(0.3, 0.7, 38, 3), "#020203", null); poly(arch(0.38, 0.62, 26, 6), "#000000", null);   // deeper in
        ctx.globalAlpha = 0.35 + 0.15 * Math.sin(f * 0.03); poly(arch(0.22, 0.78, 50, 0), null, "#ff7a2a", 1.5); ctx.globalAlpha = 1;   // the rim still warm
        for (const [u, z, w] of [[0.12, 0, 0.08], [0.85, 0, 0.09], [0.24, 0, 0.06]]) poly([[u - w / 2, z], [u - w / 3, z + 9], [u + w / 3, z + 10], [u + w / 2, z]], "#6a5848", "#0b2a2f", 2);
        ctx.restore(); return;
    }
    const hits = (_techRubbleHits()[r.id] || 0), heat = hits / TECH_AB.drill.hits, show = _TECH_RUBBLE.length - Math.floor(hits * _TECH_RUBBLE.length / (TECH_AB.drill.hits + 1));
    const shades = ["#a8967e", "#8e7c66", "#bba98f", "#9a8670"];
    for (let sg = 0; sg < segs; sg++) {   // one pile (two tiles of it), then the next
        const P = (u, z) => _fpWP(it, (sg + u) / segs, z), pl = (pts, fill, stroke, lw) => polyW(P, pts, fill, stroke, lw), seed = (it.seed + sg * 7919) >>> 0;
        const u0 = sg ? 0 : 0.08, u1 = sg === segs - 1 ? 0.95 : 1;   // (the piles of a long choke butt against one another: no floor shows between them)
        pl([[u0, 0], [u0 + 0.04, 30], [0.3, 52], [0.55, 58], [0.8, 48], [u1 - 0.01, 26], [u1, 0]], "#2a1e18", null);   // the dark gap the pile fills
        const rock = (uc, zb, w, h, k) => {
            const j = ((seed >>> k) % 5) * 0.012, pts = [[uc - w / 2, zb + h * 0.1], [uc - w * 0.42, zb + h * 0.7], [uc - w * 0.1 + j, zb + h], [uc + w * 0.32, zb + h * 0.86], [uc + w / 2, zb + h * 0.3], [uc + w * 0.22, zb]];
            pl(pts, shades[(k + seed) % shades.length], "#0b2a2f", 2.5);
            pl([pts[1], pts[2], pts[3], [uc, zb + h * 0.62]], "rgba(255,255,255,0.13)", null);   // the lit top
        };
        for (let k = 0; k < Math.min(show, _TECH_RUBBLE.length); k++) { const [uc, zb, w, h] = _TECH_RUBBLE[k]; rock(uc, zb, w, h, k); }
        if (sg && show > 2) rock(0.02, 0, 0.18, 20, 11);   // (a boulder across the joint with the pile before it)
        if (show > 4 && (segs === 1 || (sg + (it.seed & 1)) % 2 === 0)) { pl([[0.28, 6], [0.3, 13], [0.72, 23], [0.7, 16]], "#c9c2b4", "#0b2a2f", 2); for (let s = 0; s < 4; s++) pl([[0.34 + s * 0.09, 7.4 + s * 2.3], [0.37 + s * 0.09, 14.2 + s * 2.3], [0.4 + s * 0.09, 14.9 + s * 2.3], [0.37 + s * 0.09, 8.1 + s * 2.3]], "#ffd21a", null); }   // a cracked slab across it, hazard-painted (every other pile of a long choke)
        // the seams between the stones: dull at first, glowing hotter with each hit
        ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
        const glow = 0.25 + 0.75 * heat, pul = 0.75 + 0.25 * Math.sin(f * 0.15 + sg);
        for (const seam of [[[0.32, 0], [0.33, 14], [0.46, 26], [0.5, 40]], [[0.58, 0], [0.6, 18], [0.7, 30]], [[0.2, 20], [0.36, 36], [0.44, 50]]]) {
            ctx.strokeStyle = "rgba(255,120,40," + (0.22 * glow * pul).toFixed(3) + ")"; ctx.lineWidth = 7; ctx.beginPath(); seam.forEach((q, i) => { const p = P(q[0], q[1]); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke();
            ctx.strokeStyle = "rgba(255,190,90," + (0.5 * glow * pul).toFixed(3) + ")"; ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over"; ctx.lineCap = "butt";
    }
    ctx.restore();
}
// ── on each floor tile (js/game.js draws it with the tile, like the serum's pools): the FROST PATCH's ice, the TOXIC PODS' fields ──
function techDrawOnTile(tx, ty, px, py) {
    const FX = techAim && techAim.flux && techAim.flux.s && typeof fluxDrawOnTile === "function" ? techAim : null;   // FLUX MOVE's grid, on the floor (js/fluxmove.js): drawn last on the tile
    if (!techFrosts.length && !techPools.length && !techBridges.length && !techReefs.length) { if (FX) fluxDrawOnTile(FX, tx, ty, px, py); return; }
    const g = ctx, f0 = _techFrame(), W = TILE_W, H = TILE_H, S = (x, y) => [px + ((x - tx) - (y - ty)) * W, py + H + ((x - tx) + (y - ty)) * H];   // a point of the floor near this tile, on the screen
    const tile = () => { g.beginPath(); g.moveTo(px, py); g.lineTo(px + W, py + H); g.lineTo(px, py + 2 * H); g.lineTo(px - W, py + H); g.closePath(); };
    const key = tx + "," + ty;
    for (const P of techFrosts) {
        if (f0 >= P.until || !P.tiles.has(key)) continue;
        const a = Math.min(1, (f0 - P.t0 + 1) / 8, (P.until - f0) / 90), seed = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
        g.save(); tile(); g.clip();
        const gr = g.createLinearGradient(px - W, py, px + W, py + 2 * H); gr.addColorStop(0, "rgba(220,248,255," + (0.62 * a).toFixed(3) + ")"); gr.addColorStop(1, "rgba(120,200,240," + (0.5 * a).toFixed(3) + ")");
        g.fillStyle = gr; g.fillRect(px - W, py, 2 * W, 2 * H);
        g.strokeStyle = "rgba(255,255,255," + (0.55 * a).toFixed(3) + ")"; g.lineWidth = 1;   // cracks in the ice
        for (let k = 0; k < 3; k++) { const u = ((seed >>> (k * 4)) % 13) / 13, v = ((seed >>> (k * 4 + 2)) % 11) / 11, p = S(tx - 0.5 + u, ty - 0.5 + v); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + 9 - k * 6, p[1] + 3 + k); g.lineTo(p[0] + 13 - k * 4, p[1] - 4); g.stroke(); }
        if ((f0 + seed) % 90 < 8) { const p = S(tx + ((seed % 7) - 3) / 10, ty + ((seed % 5) - 2) / 10); g.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")"; g.fillRect(p[0] - 1, p[1] - 3, 2, 6); g.fillRect(p[0] - 3, p[1] - 1, 6, 2); }   // a glint
        g.restore();
    }
    for (const B of techBridges) {   // an ICE BRIDGE: its tiles are floor while it stands (js/facilityplay.js facilityIceSet), drawn as pale ice with cracks and a white rim; it flickers in its last 3 s
        const r = B.rect; if (tx < r[0] || tx > r[2] || ty < r[1] || ty > r[3]) continue;
        const left = B.until - f0, a = Math.min(1, (f0 - B.t0 + 1) / 10) * (left < 180 ? 0.55 + 0.45 * Math.abs(Math.sin(f0 * 0.25)) : 1), seed = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
        g.save(); tile(); g.clip();
        const gr = g.createLinearGradient(px - W, py, px + W, py + 2 * H); gr.addColorStop(0, "rgba(236,250,255," + (0.97 * a).toFixed(3) + ")"); gr.addColorStop(1, "rgba(140,205,238," + (0.95 * a).toFixed(3) + ")");
        g.fillStyle = gr; g.fillRect(px - W, py, 2 * W, 2 * H);
        g.strokeStyle = "rgba(70,140,185," + (0.5 * a).toFixed(3) + ")"; g.lineWidth = 1;   // cracks
        for (let k = 0; k < 2; k++) { const u = ((seed >>> (k * 4)) % 13) / 13, v = ((seed >>> (k * 4 + 2)) % 11) / 11, p = S(tx - 0.5 + u, ty - 0.5 + v); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + 9 - k * 6, p[1] + 3 + k); g.lineTo(p[0] + 13 - k * 4, p[1] - 4); g.stroke(); }
        g.strokeStyle = "rgba(255,255,255," + (0.95 * a).toFixed(3) + ")"; g.lineWidth = 3;   // the rim, on the bridge's outer edges
        const e = (x0, y0, x1, y1) => { const p0 = S(x0, y0), p1 = S(x1, y1); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); };
        if (tx - 0.5 <= r[0] + 1e-6) e(tx - 0.5, ty - 0.5, tx - 0.5, ty + 0.5); if (tx + 0.5 >= r[2] - 1e-6) e(tx + 0.5, ty - 0.5, tx + 0.5, ty + 0.5);
        if (ty - 0.5 <= r[1] + 1e-6) e(tx - 0.5, ty - 0.5, tx + 0.5, ty - 0.5); if (ty + 0.5 >= r[3] - 1e-6) e(tx - 0.5, ty + 0.5, tx + 0.5, ty + 0.5);
        g.restore();
    }
    for (const P of techPools) {   // a TOXIC POD's field: a round green haze on the floor, brightest at the pod, with a faint rim, weaker and smaller as the pod runs down
        const k = techPoolFade(P), h = TECH_AB.blight.size / 2 * k; if (k <= 0 || Math.hypot(tx - P.x, ty - P.y) > h + 0.75) continue;
        const a = 0.3 + 0.5 * k, c = S(P.x, P.y), R = h * Math.SQRT2 * W * (1 + 0.04 * Math.sin(f0 * 0.08 + P.id));
        g.save(); tile(); g.clip(); g.translate(c[0], c[1]); g.scale(1, H / W);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, R); gr.addColorStop(0, "rgba(140,255,80," + (0.5 * a).toFixed(3) + ")"); gr.addColorStop(0.7, "rgba(80,190,40," + (0.32 * a).toFixed(3) + ")"); gr.addColorStop(1, "rgba(60,150,30,0)");
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fill();
        g.strokeStyle = "rgba(190,255,120," + (0.45 * a).toFixed(3) + ")"; g.lineWidth = 1.5; g.setLineDash([5, 6]); g.lineDashOffset = -f0 * 0.3; g.beginPath(); g.arc(0, 0, R * 0.96, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
        g.restore();
    }
    for (const O of techReefs) {   // REEF's mending, on the floor round an outcrop (a REEF PILLAR's spikes): a faint pink haze out to where your followers are mended, its rim a dashed ring (under the walls and units in front)
        if (!_techReefOn(O, f0)) continue;
        const a = Math.min(1, (f0 - O.t0) / 12, (O.until - f0) / 60);
        for (const c of O.parts) {
            const R0 = c.r + O.mendReach; if (Math.hypot(tx - c.x, ty - c.y) > R0 + 1.25) continue;
            const q = S(c.x - 0.5, c.y - 0.5), R = R0 * Math.SQRT2 * W;   // (centred under the rock: an item's foot is its tile's top corner)
            g.save(); tile(); g.clip(); g.translate(q[0], q[1]); g.scale(1, H / W);
            const gr = g.createRadialGradient(0, 0, R * 0.2, 0, 0, R); gr.addColorStop(0, "rgba(255,122,184," + (0.2 * a).toFixed(3) + ")"); gr.addColorStop(1, "rgba(255,122,184,0)");
            g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fill();
            g.strokeStyle = "rgba(255,170,210," + (0.35 * a).toFixed(3) + ")"; g.lineWidth = 1.5; g.setLineDash([6, 7]); g.lineDashOffset = f0 * 0.25; g.beginPath(); g.arc(0, 0, R * 0.97, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
            g.restore();
        }
    }
    if (FX) fluxDrawOnTile(FX, tx, ty, px, py);
}
// the launchers and the ledges stand among everything else (js/game.js sorts them by depth)
function techDrawItems(list) {
    if (typeof _fp === "undefined" || !_fp) return;
    for (const s of _techSites()) {
        if (techLauncherAt(s.id)) list.push({ type: "tech", kind: "launcher", x: s.at[0], y: s.at[1], site: s });
    }
    for (const L of _techLedges()) { const d = _techLedgeDir(L); list.push({ type: "tech", kind: "ledge", x: L.at[0] + d[0] * 0.5, y: L.at[1] + d[1] * 0.5, L, d }); }   // (at the deck's edge, over the drop)
    // a Photonic Shield, in pieces half a tile long, so what stands behind it is drawn behind it and what stands in front, in front
    for (const W of techShields) {
        if (!_techShieldOn(W)) continue;
        const n = Math.max(1, Math.ceil((W.u1 - W.u0) / 0.5)), du = (W.u1 - W.u0) / n;
        for (let i = 0; i < n; i++) { const ua = W.u0 + du * i, ub = ua + du, um = (ua + ub) / 2; list.push({ type: "tech", kind: "shield", x: W.x - W.ny * um, y: W.y + W.nx * um, W, ua, ub, first: i === 0, last: i === n - 1 }); }
    }
    for (const P of techPools) if (techPoolFade(P) > 0) list.push({ type: "tech", kind: "pod", x: P.x, y: P.y, P });   // a TOXIC POD, standing among everything else
    const f0 = _techFrame();
    for (const O of techReefs) if (_techReefOn(O, f0)) O.parts.forEach((c, i) => list.push({ type: "tech", kind: "reef", x: c.x, y: c.y, O, c, i }));   // REEF's outcrops (a REEF PILLAR's three spikes)
    for (const C of techClimbs) if (f0 >= C.t0) { list.push({ type: "tech", kind: "climbFoot", x: C.foot[0], y: C.foot[1], C }); list.push({ type: "tech", kind: "climbTop", x: C.top[0], y: C.top[1], C }); }   // a REEF climb's two ends
}
// ── REEF's rock and crystal (the coral crab's look, No. 914: smooth rounded plates of dark stone, big square pink crystals breaking out of them with a pink glow round them, crystal flowers among them) ──
function _techHash(n) { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); return ((n ^ (n >>> 15)) >>> 0) / 4294967296; }
// one square crystal standing at (x, y) on the screen, `h` px tall and `w` wide, leaning `lean` radians: seen corner-on, its lit face and its shaded face, a pointed tip
function _techCrystal(g, x, y, h, w, lean, lit) {
    const ux = Math.sin(lean), uy = -Math.cos(lean), vx = -uy, vy = ux, P = (u, v) => [x + ux * u + vx * v, y + uy * u + vy * v];
    const body = Math.max(w * 0.4, h - w * 0.85), A = P(0, -w / 2), B = P(-w * 0.18, 0), C = P(0, w / 2), A2 = P(body, -w / 2), B2 = P(body - w * 0.18, 0), C2 = P(body, w / 2), T = P(h, w * 0.04);
    const face = (pts, col) => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fillStyle = col; g.fill(); };
    face([A, B, B2, A2], lit > 0.5 ? "#ffd3e8" : "#ffb0d4"); face([B, C, C2, B2], "#e0569a"); face([A2, B2, T], "#fff0f7"); face([B2, C2, T], "#ff8ac2");
    g.strokeStyle = "#3a0c24"; g.lineWidth = 2; g.lineJoin = "round"; g.beginPath(); [A, A2, T, C2, C, B, A].forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 1; g.beginPath(); g.moveTo(B[0], B[1]); g.lineTo(B2[0], B2[1]); g.lineTo(T[0], T[1]); g.stroke();   // the near edge, catching the light
}
// a smooth rounded boulder of dark stone standing on (x, y): its shaded side, its rounded top, a soft highlight; rx by ry px across the top
function _techStone(g, x, y, rx, ry, k) {
    const h = ry * 0.9, top = ["#3a3542", "#433d4b", "#36313e"][k % 3];
    g.strokeStyle = "#0c0b10"; g.lineWidth = 2;
    g.fillStyle = "#1c1a22"; g.beginPath(); g.ellipse(x, y - h * 0.45, rx, ry + h * 0.45, 0, 0, Math.PI * 2); g.fill(); g.stroke();   // its body, its side in shade
    g.fillStyle = top; g.beginPath(); g.ellipse(x, y - h, rx * 0.94, ry * 0.92, 0, 0, Math.PI * 2); g.fill();   // its rounded top
    g.fillStyle = "rgba(255,255,255,0.1)"; g.beginPath(); g.ellipse(x - rx * 0.22, y - h - ry * 0.25, rx * 0.5, ry * 0.4, 0, 0, Math.PI * 2); g.fill();   // the light on it
}
// a crystal flower: a few short square crystals round a stone centre
function _techFlower(g, x, y, s, seed) {
    const n = 4 + Math.floor(_techHash(seed) * 4);
    for (let i = 0; i < n; i++) { const lean = (i - (n - 1) / 2) * 0.5 + (_techHash(seed + i) - 0.5) * 0.2; _techCrystal(g, x, y, s * (0.8 + 0.4 * _techHash(seed + 9 + i)), s * 0.34, lean, i % 2); }   // (fanned out round its middle)
    g.fillStyle = "#3b3641"; g.strokeStyle = "#0c0b10"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y - 1, s * 0.3, s * 0.2, 0, 0, Math.PI * 2); g.fill(); g.stroke();
}
// a pink glow on the rock round the crystals
function _techReefGlow(g, x, y, r, a) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,122,184," + (0.42 * a).toFixed(3) + ")"); gr.addColorStop(1, "rgba(255,122,184,0)");
    g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.globalCompositeOperation = "source-over";
}
// AN OUTCROP (or one of a REEF PILLAR's spikes) at (px, py): it bursts up when its shards land, flashes where an enemy leans on it, and sinks into the floor in its last second
function _techDrawReef(g, o, px, py, f0) {
    const O = o.O, c = o.c, age = f0 - O.t0, left = O.until - f0, seed = O.id * 7 + o.i * 131;
    const up = Math.min(1, age / 10), pop = up < 1 ? up * (1.15 - 0.15 * up) : 1, sink = left < 60 ? left / 60 : 1, s = pop * (0.35 + 0.65 * sink), a = Math.min(1, sink * 1.4);
    const RX = c.r * TILE_W * 1.35, RY = c.r * TILE_H * 1.35, pillar = O.pillar, core = pillar && o.i === 0;
    g.globalAlpha = a;
    g.fillStyle = "rgba(0,0,0,0.38)"; g.beginPath(); g.ellipse(px, py, RX * 1.05, RY * 1.05, 0, 0, Math.PI * 2); g.fill();   // its shadow
    const stones = [[-0.12, -0.42, 0.42, 16], [0.34, -0.3, 0.38, 10], [-0.5, -0.06, 0.46, 6], [0.46, 0.06, 0.44, 4], [0, 0.26, 0.52, 0], [-0.04, -0.08, 0.4, 20]];   // (the back ones first; the last one heaped on the middle: a mound, not a patch)
    stones.forEach(([sx, sy, sr, up], k) => _techStone(g, px + sx * RX, py + sy * RY * 1.3 - up * s, sr * RX * s + 3, sr * RY * 1.25 * s + 2, seed + k));
    _techReefGlow(g, px, py - 22 * s, RX * (core ? 1.5 : 1.1), (0.7 + 0.3 * Math.sin(f0 * 0.08 + seed)) * a);
    const tall = core ? 150 : pillar ? 78 : 58, list = [];
    if (core) list.push([0, 0, 1, 0.42, 0.02]);   // REEF PILLAR's giant spike
    const n = core ? 4 : pillar ? 3 : 4;
    for (let i = 0; i < n; i++) { const h = _techHash(seed + 3 + i), side = (i % 2 ? 1 : -1) * (0.18 + 0.42 * _techHash(seed + 17 + i)); list.push([side, (h - 0.5) * 0.4, core ? 0.36 + 0.2 * h : 0.55 + 0.45 * h, core ? 0.2 : 0.28, side * 0.7]); }
    list.sort((p, q) => p[1] - q[1]);   // (the ones behind first)
    for (const [ox, oy, hk, wk, lean] of list) _techCrystal(g, px + ox * RX, py + oy * RY - (core ? 10 : 16) * s, tall * hk * s, Math.max(6, tall * wk * s * (core && hk === 1 ? 0.9 : 1)), lean, ox < 0 ? 1 : 0);   // (breaking out of the stone)
    if (!core) _techFlower(g, px + (_techHash(seed + 40) - 0.5) * RX * 0.9, py + RY * 0.3 - 9 * s, 14 * s, seed + 41);   // a crystal flower among the stones
    if (O.pressedAt && f0 - O.pressedAt < 6) { g.globalAlpha = 0.7 * a; g.strokeStyle = "#ffd3e8"; g.lineWidth = 2.5; g.beginPath(); g.ellipse(px, py, RX * 1.08, RY * 1.08, 0, 0, Math.PI * 2); g.stroke(); }   // (an enemy leaning on it lights its rim)
    if (o.i === 0 && left < 600) { g.globalAlpha = Math.min(1, left / 30); g.font = (typeof uiFont === "function" ? uiFont(12) : "bold 12px sans-serif"); g.textAlign = "center"; g.fillStyle = "#ffd3e8"; g.fillText("◆ " + Math.ceil(left / 60), px, py - tall * s - 14); }   // its seconds, in its last ten
    g.globalAlpha = 1;
}
// A CLIMB: at its foot, out on the low floor, a mound of stone with crystals, and the rock and crystal running from it to the high ground's face and up it to the lip (seen through the open face: the
// railing frame under the catwalks); at its top, crystals breaking over the lip. A chevron pulses at each end, the way over.
function _techDrawClimb(g, o, px, py, f0) {
    const C = o.C, lift = typeof facilityLiftPx === "function" ? facilityLiftPx : () => 0, age = f0 - C.t0, s = Math.min(1, Math.max(0, age) / 14), seed = C.id * 13;
    const rel = (x, y, z) => [px + ((x - o.x) - (y - o.y)) * TILE_W, py + ((x - o.x) + (y - o.y)) * TILE_H - z];
    if (o.kind === "climbFoot") {
        const zTop = (lift(C.top[0], C.top[1]) - lift(C.foot[0], C.foot[1])) * s, N = 9;
        for (let i = N; i >= 1; i--) {   // the rock and crystal up to the lip, the far stones first
            const t = i / N, x = C.foot[0] + (C.edge[0] - C.foot[0]) * t, y = C.foot[1] + (C.edge[1] - C.foot[1]) * t, z = zTop * Math.pow(t, 1.7), q = rel(x, y, z), r = 14 + 8 * (1 - t);
            _techStone(g, q[0], q[1], r, r * 0.6, seed + i);
            if (i % 2 === 0) _techCrystal(g, q[0] + (i % 4 ? -6 : 6), q[1] - 2, 24 + 10 * _techHash(seed + i), 8, (i % 4 ? -0.35 : 0.35), i % 4 ? 1 : 0);
        }
        g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.ellipse(px, py, 34, 15, 0, 0, Math.PI * 2); g.fill();
        _techStone(g, px - 14, py - 4, 18 * s + 2, 10 * s + 2, seed); _techStone(g, px + 13, py - 2, 16 * s + 2, 9 * s + 2, seed + 1);
        _techReefGlow(g, px, py - 16, 40, 0.8 + 0.2 * Math.sin(f0 * 0.08));
        _techCrystal(g, px - 8, py - 6, 40 * s, 12, -0.25, 1); _techCrystal(g, px + 9, py - 4, 30 * s, 10, 0.3, 0); _techFlower(g, px + 2, py + 4, 12 * s, seed + 5);
    } else {
        const ex = C.edge[0] - C.top[0], ey = C.edge[1] - C.top[1], q = rel(C.top[0] + ex * 0.7, C.top[1] + ey * 0.7, 0);   // at the lip, on the high floor's edge
        _techReefGlow(g, q[0], q[1] - 12, 34, 0.75 + 0.25 * Math.sin(f0 * 0.08 + 1));
        _techStone(g, q[0] + 8, q[1] + 2, 15 * s + 2, 8 * s + 2, seed + 7);
        _techCrystal(g, q[0] - 6, q[1], 34 * s, 11, -0.3, 1); _techCrystal(g, q[0] + 6, q[1] + 1, 26 * s, 9, 0.35, 0); _techCrystal(g, q[0] + 16, q[1] + 3, 18 * s, 7, 0.6, 0);
    }
    const near = typeof player !== "undefined" && _techClimbEnd(C, player.x, player.y), mine = near && near.at === (o.kind === "climbFoot" ? C.foot : C.top);
    if (mine) {   // the chevron over your end: up at its foot, down at its top
        const t = (f0 * 0.02) % 1, up = o.kind === "climbFoot";
        g.font = (typeof uiFont === "function" ? uiFont(15) : "bold 15px sans-serif"); g.textAlign = "center"; g.textBaseline = "middle";
        for (let k = 0; k < 2; k++) { const tt = (t + k / 2) % 1, y = py - 30 + (up ? -tt * 26 : tt * 26); g.globalAlpha = Math.sin(tt * Math.PI) * 0.9; g.fillStyle = "#3a0c24"; g.fillText(up ? "▲" : "▼", px + 1, y + 1); g.fillStyle = "#ff9ccc"; g.fillText(up ? "▲" : "▼", px, y); }
        g.globalAlpha = 1;
    }
}
function techDrawItem(o, px, py) {
    const g = ctx, f0 = _techFrame();
    g.save();
    if (o.kind === "reef") _techDrawReef(g, o, px, py, f0);
    else if (o.kind === "climbFoot" || o.kind === "climbTop") _techDrawClimb(g, o, px, py, f0);
    else if (o.kind === "pod") {
        // a TOXIC POD: a small glass canister of bubbling toxin on a black base, a black cap with a lens (the Blight Spider's own tank, small); the toxin's level and the lens fall as it runs down
        const k = techPoolFade(o.P), lit = 0.35 + 0.65 * k * (0.75 + 0.25 * Math.sin(f0 * 0.15 + o.P.id));
        g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.ellipse(px, py, 12, 5, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#0e1016"; g.beginPath(); g.ellipse(px, py - 2, 10, 4.5, 0, 0, Math.PI * 2); g.fill(); g.fillRect(px - 10, py - 7, 20, 5); g.beginPath(); g.ellipse(px, py - 7, 10, 4.5, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = "rgba(150,255,140,0.14)"; g.fillRect(px - 6, py - 26, 12, 19);   // the glass
        const lv = 17 * k; g.fillStyle = "rgba(110,255,60,0.85)"; g.fillRect(px - 6, py - 8 - lv, 12, lv);   // the toxin, down as it runs down
        g.fillStyle = "rgba(220,255,170,0.8)"; for (let b = 0; b < 3; b++) { const ph = ((f0 + o.P.id * 17 + b * 23) % 60) / 60; if (ph * 17 < lv) g.fillRect(px - 4 + b * 3, py - 9 - ph * 17, 2, 2); }   // bubbles rising in it
        g.strokeStyle = "rgba(200,255,190,0.6)"; g.lineWidth = 1; g.strokeRect(px - 6, py - 26, 12, 19); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(px - 4, py - 24, 2, 14);   // its rim, a highlight
        g.fillStyle = "#0e1016"; g.fillRect(px - 8, py - 30, 16, 5); g.fillStyle = "#1b1f2b"; g.fillRect(px - 5, py - 33, 10, 3);   // the cap
        g.fillStyle = "rgba(125,255,74," + lit.toFixed(3) + ")"; g.beginPath(); g.arc(px, py - 28, 2, 0, Math.PI * 2); g.fill();   // the lens
    } else if (o.kind === "launcher") {
        // a squat pad in the Hover Shell's black with two launch prongs, lit yellow; its coil pulses while it is free
        const busy = _techSiteBusy(o.site), pulse = busy ? 1 : 0.55 + 0.45 * Math.sin(f0 * 0.12);
        g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.ellipse(px, py, 26, 12, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#0e1016"; g.beginPath(); g.moveTo(px - 22, py - 4); g.lineTo(px, py - 15); g.lineTo(px + 22, py - 4); g.lineTo(px, py + 7); g.closePath(); g.fill();
        g.fillStyle = "#1b1f2b"; g.fillRect(px - 22, py - 9, 44, 5);
        g.strokeStyle = "#ffe733"; g.lineWidth = 2; g.globalAlpha = 0.5 + 0.5 * pulse; g.beginPath(); g.ellipse(px, py - 7, 13, 6, 0, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
        for (const sx of [-1, 1]) {
            g.strokeStyle = "#0b0c10"; g.lineWidth = 5; g.beginPath(); g.moveTo(px + sx * 8, py - 9); g.lineTo(px + sx * 13, py - 38); g.stroke();
            g.strokeStyle = "#ffe733"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(px + sx * 9, py - 14); g.lineTo(px + sx * 12, py - 32); g.stroke();
            g.fillStyle = "#c9ccd4"; g.beginPath(); g.moveTo(px + sx * 13, py - 44); g.lineTo(px + sx * 16, py - 36); g.lineTo(px + sx * 10, py - 36); g.closePath(); g.fill();
        }
    } else if (o.kind === "ledge") {
        // THE LEDGE (build 2026-11-07qq): over the deck's edge where the rail stops (js/facilitydecor.js draws the gap and its hazard paint), arrows pointing down, one after another, so the way down reads from the floor too
        const L = o.L, q = _techScr(L.at[0], L.at[1]), d = o.d, ex = q.x + (d[0] - d[1]) * TILE_W * 0.5, ey = q.y + (d[0] + d[1]) * TILE_H * 0.5;
        g.font = (typeof uiFont === "function" ? uiFont(15) : "bold 15px sans-serif"); g.textAlign = "center"; g.textBaseline = "middle";
        for (let k = 0; k < 3; k++) { const t = ((f0 * 0.012 + k / 3) % 1), y = ey - 8 + t * 34; g.globalAlpha = Math.sin(t * Math.PI) * 0.9; g.fillStyle = "#0b0c10"; g.fillText("▼", ex + 1, y + 1); g.fillStyle = "#ffd21a"; g.fillText("▼", ex, y); }
        g.globalAlpha = 1;
    } else if (o.kind === "shield") {
        // a piece of a Photonic Shield: a pane of teal light standing on the floor, its foot and top lit, light running up it; a ripple where it stopped something; it rises as it goes up and flickers in its last 3 s
        const W = o.W, um = (o.ua + o.ub) / 2, age = f0 - W.t0, left = W.until - f0;
        const sxu = du => (-W.ny - W.nx) * TILE_W * du, syu = du => (W.nx - W.ny) * TILE_H * du;   // (a step along it, on the screen)
        const a0 = o.first ? o.ua - 0.12 : o.ua, a1 = o.last ? o.ub + 0.12 : o.ub;   // (a little past its ends, to meet a wall)
        const x0 = px + sxu(a0 - um), y0 = py + syu(a0 - um), x1 = px + sxu(a1 - um), y1 = py + syu(a1 - um);
        const H = 58 * Math.min(1, age / 8), vis = left < 180 ? 0.6 + 0.4 * Math.sin(f0 * 0.5) : 1;
        const pane = () => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x1, y1 - H); g.lineTo(x0, y0 - H); g.closePath(); };
        const gr = g.createLinearGradient(0, Math.min(y0, y1) - H, 0, Math.max(y0, y1));
        gr.addColorStop(0, "rgba(95,247,224,0.04)"); gr.addColorStop(0.7, "rgba(95,247,224,0.2)"); gr.addColorStop(1, "rgba(95,247,224,0.38)");
        g.globalAlpha = vis; g.fillStyle = gr; pane(); g.fill();
        if (W.pressedAt && f0 - W.pressedAt < 6) { g.globalAlpha = 0.22 * vis; g.fillStyle = "#bffcf2"; pane(); g.fill(); g.globalAlpha = vis; }   // (a creature leaning on it lights it)
        g.strokeStyle = "rgba(191,252,242,0.5)"; g.lineWidth = 1;
        for (let k = 0; k < 3; k++) { const t = ((f0 * 0.012 + k / 3 + o.ua * 0.37) % 1 + 1) % 1, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; g.beginPath(); g.moveTo(x, y - 2); g.lineTo(x, y - H + 4); g.stroke(); }
        g.strokeStyle = "#5ff7e0"; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        g.strokeStyle = "#dffef8"; g.beginPath(); g.moveTo(x0, y0 - H); g.lineTo(x1, y1 - H); g.stroke();
        g.lineWidth = 3; g.strokeStyle = "#bffcf2"; if (o.first) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y0 - H); g.stroke(); } if (o.last) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1, y1 - H); g.stroke(); }
        for (const h of W.hits) {
            const k = (f0 - h.t) / 24; if (k < 0 || k > 1 || h.u < o.ua - 1e-6 || h.u > o.ub + 1e-6) continue;
            g.globalAlpha = vis * (1 - k); g.strokeStyle = "#ffffff"; g.lineWidth = 2; g.beginPath(); g.ellipse(px + sxu(h.u - um), py + syu(h.u - um) - H * 0.45, 5 + 14 * k, 9 + 18 * k, 0, 0, Math.PI * 2); g.stroke();
        }
        if ((o.ua <= 0 && 0 < o.ub) || (o.last && o.ub <= 0)) {   // the seconds left, over its middle (one piece has it)
            g.globalAlpha = vis; g.font = (typeof uiFont === "function" ? uiFont(12) : "bold 12px sans-serif"); g.textAlign = "center"; g.fillStyle = "#dffef8";
            g.fillText("◈ " + Math.max(0, Math.ceil(left / 60)), px + sxu(-um), py + syu(-um) - H - 8);
        }
    }
    g.restore();
}
// over the world: a site's highlight and label, a set-up's progress, the arc a launcher throws on, the aim's rings, the flyers' shadows
function techDrawOverlay() {
    if (typeof _fp === "undefined" || !_fp || typeof ctx === "undefined" || !ctx) return;
    const g = ctx, f0 = _techFrame(), T = TECH_AB.launch; _techLabels = {};
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    const font = n => typeof uiFont === "function" ? uiFont(n) : "bold " + n + "px sans-serif";
    // A LEDGE's tag (while you are up there with it, and the floors are still apart): ▼ LEDGE; a tap on it walks you there and you jump (techSiteTap); walking onto it does the same
    for (const L of _techLedges()) {
        const dd = Math.hypot(L.at[0] - player.visualX, L.at[1] - player.visualY); if (dd > T.near || _techLedgeFrom(player.x, player.y) !== L) continue;
        const q = _techScr(L.at[0], L.at[1]), a2 = Math.min(1, (T.near - dd) / 2), txt2 = "▼ LEDGE · STEP OFF IT TO JUMP DOWN";
        g.globalAlpha = a2 * 0.9; g.font = font(11); g.textAlign = "center"; g.textBaseline = "middle"; const w2 = g.measureText(txt2).width + 16, y2 = q.y - 52;
        g.fillStyle = "rgba(5,8,18,0.7)"; g.fillRect(q.x - w2 / 2, y2 - 10, w2, 20); g.strokeStyle = "rgba(255,210,26,0.6)"; g.lineWidth = 1; g.strokeRect(q.x - w2 / 2 + 0.5, y2 - 9.5, w2 - 1, 19); g.fillStyle = "#ffd21a"; g.fillText(txt2, q.x, y2 + 1);
        _techLabels["ledge:" + L.id] = { x: q.x - w2 / 2, y: y2 - 10, w: w2, h: 20 };
    }
    // A REEF CLIMB's tag, over its end on your floor, while you are near it: ◆ REEF · CLIMB UP (or DOWN); a tap on it walks you there and takes you over (techSiteTap); a walk that ends on it does the same
    for (const C of techClimbs) {
        const E = _techClimbEnd(C, player.x, player.y); if (!E) continue;
        const dd = Math.hypot(E.at[0] - player.visualX, E.at[1] - player.visualY); if (dd > T.near) continue;
        const q = _techScr(E.at[0], E.at[1]), a2 = Math.min(1, (T.near - dd) / 2), txt2 = E.up ? "◆ REEF · CLIMB UP" : "◆ REEF · CLIMB DOWN";
        g.globalAlpha = a2 * 0.9; g.font = font(11); g.textAlign = "center"; g.textBaseline = "middle"; const w2 = g.measureText(txt2).width + 16, y2 = q.y - 98;   // (above a launcher site's tag, which may stand beside it)
        g.fillStyle = "rgba(18,5,12,0.72)"; g.fillRect(q.x - w2 / 2, y2 - 10, w2, 20); g.strokeStyle = "rgba(255,122,184,0.65)"; g.lineWidth = 1; g.strokeRect(q.x - w2 / 2 + 0.5, y2 - 9.5, w2 - 1, 19); g.fillStyle = "#ff9ccc"; g.fillText(txt2, q.x, y2 + 1);
        _techLabels["climb:" + C.id] = { x: q.x - w2 / 2, y: y2 - 10, w: w2, h: 20 };
    }
    // REEF's SHARDS in flight, from the coral crab to where the rock and crystal will grow (an outcrop's parts; a climb's foot and the lip above it)
    {
        const lift = typeof facilityLiftPx === "function" ? facilityLiftPx : () => 0, N = TECH_AB.reef.shards;
        const shards = (from, tos, t0, id) => {
            const t = 1 - (t0 - f0) / N; if (t < 0 || t > 1 || !from) return;
            tos.forEach((to, k) => {
                for (let j = 0; j < 2; j++) {
                    const tt = Math.max(0, Math.min(1, t * 1.1 - j * 0.1)), z0 = lift(from[0], from[1]) + 18, z1 = to[2] !== undefined ? to[2] : lift(to[0], to[1]), qa = _techArcScr(from[0], from[1], to[0], to[1], z0, z1, 46, Math.max(0, tt - 0.08)), qb = _techArcScr(from[0], from[1], to[0], to[1], z0, z1, 46, tt);
                    g.globalCompositeOperation = "lighter"; g.strokeStyle = "rgba(255,122,184,0.55)"; g.lineWidth = 4; g.lineCap = "round"; g.beginPath(); g.moveTo(qa.x, qa.y); g.lineTo(qb.x, qb.y); g.stroke(); g.globalCompositeOperation = "source-over";
                    const ang = Math.atan2(qb.y - qa.y, qb.x - qa.x); g.save(); g.translate(qb.x, qb.y); g.rotate(ang + (id + k + j)); g.fillStyle = "#ffd3e8"; g.strokeStyle = "#3a0c24"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(5, 0); g.lineTo(0, 3); g.lineTo(-5, 0); g.lineTo(0, -3); g.closePath(); g.fill(); g.stroke(); g.restore();
                }
            });
        };
        for (const O of techReefs) if (f0 < O.t0) shards(O.from, O.parts.map(c => [c.x, c.y]), O.t0, O.id);
        for (const C of techClimbs) if (f0 < C.t0) shards(C.from, [C.foot, [C.edge[0], C.edge[1], lift(C.top[0], C.top[1])]], C.t0, C.id);
        g.lineCap = "butt";
    }
    for (const s of _techSites()) {
        const d = Math.hypot(s.at[0] - player.visualX, s.at[1] - player.visualY);
        if (d > T.near) continue;
        const p = _techScr(s.at[0], s.at[1]), a = Math.min(1, (T.near - d) / 2), on = techLauncherAt(s.id);
        if (!on) {   // the spot it can stand on: a faint dashed outline (subtle: no fill, no pulse)
            g.globalAlpha = a * 0.45; g.strokeStyle = "#ffe733"; g.lineWidth = 1.5; g.setLineDash([5, 6]); g.beginPath(); g.moveTo(p.x, p.y - TILE_H); g.lineTo(p.x + TILE_W, p.y); g.lineTo(p.x, p.y + TILE_H); g.lineTo(p.x - TILE_W, p.y); g.closePath(); g.stroke(); g.setLineDash([]);
        }
        const work = (typeof followers !== "undefined" ? followers : []).find(q => q && !q.dead && q._siteWork && q._siteWork.site === s.id && q._siteWork.workAt !== null);
        if (work) { const k = Math.min(1, (f0 - work._siteWork.workAt) / T.setup); g.globalAlpha = 1; g.strokeStyle = "#ffe733"; g.lineWidth = 4; g.beginPath(); g.arc(p.x, p.y - 30, 16, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); g.stroke(); }
        // its TAG: small and quiet (ASKED: "it should remain subtle and uninterruptive"); a tap on it is the only tap the site takes
        const txt = on ? (s.rider ? "⚡ LAUNCHER · RIDE IT · SEND A FOLLOWER" : s.pocket ? "⚡ LAUNCHER · SEND IN" : "⚡ LAUNCHER · SEND UP") : work || _techSettingUp(s) ? "⚡ SETTING UP" : "⚡ LAUNCHER SITE";
        g.globalAlpha = a * 0.85; g.font = font(11); g.textAlign = "center"; g.textBaseline = "middle";
        const w = g.measureText(txt).width + 16, y = p.y - 70;
        g.fillStyle = "rgba(5,8,18,0.7)"; g.fillRect(p.x - w / 2, y - 10, w, 20); g.strokeStyle = "rgba(255,231,51,0.55)"; g.lineWidth = 1; g.strokeRect(p.x - w / 2 + 0.5, y - 9.5, w - 1, 19); g.fillStyle = "rgba(255,231,51,0.9)"; g.fillText(txt, p.x, y + 1);
        _techLabels[s.id] = { x: p.x - w / 2, y: y - 10, w, h: 20 };
    }
    g.globalAlpha = 1;
    const A = techAim;
    if (A && A.mode === "site") {   // THE PREVIEW: the arc a follower is thrown on, and where it comes down
        const s = _techSite(A.site), lift = typeof facilityLiftPx === "function" ? facilityLiftPx : () => 0;
        if (s) {
            const z0 = lift(s.at[0], s.at[1]), z1 = lift(s.land[0], s.land[1]);
            g.strokeStyle = "#ffe733"; g.lineWidth = 3; g.setLineDash([9, 7]); g.lineDashOffset = -f0 * 0.6; g.beginPath();
            for (let i = 0; i <= 24; i++) { const q = _techArcScr(s.at[0], s.at[1], s.land[0], s.land[1], z0, z1, T.sitePeak, i / 24); if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); }
            g.stroke(); g.setLineDash([]); g.lineDashOffset = 0;
            const q = _techArcScr(s.land[0], s.land[1], s.land[0], s.land[1], z1, z1, 0, 0);
            g.strokeStyle = "#ffe733"; g.lineWidth = 2; g.beginPath(); g.ellipse(q.x, q.y, 18, 9, 0, 0, Math.PI * 2); g.stroke();
            g.fillStyle = "#ffe733"; g.font = font(12); g.textAlign = "center"; g.fillText("LANDS HERE", q.x, q.y - 16);
        }
    }
    if (A && A.ab && A.ab.id === "faultline") _techDrawFaultStroke(g, A, f0);   // FAULTLINE's path as it is drawn
    if (A && A.flux && typeof fluxDrawAim === "function") fluxDrawAim(g, A, f0);   // FLUX MOVE: the objects that move, then the picked one's grid and the place chosen (js/fluxmove.js)
    if (A && A.mode === "combat") {   // rings round the technician, and the follower picked to throw
        for (const u of [A.f, A.picks.follower]) { if (!u || u.dead) continue; const p = _techScr(u.x, u.y); g.strokeStyle = u === A.f ? "#ffe733" : "#ffffff"; g.lineWidth = 2; g.beginPath(); g.ellipse(p.x, p.y, 20, 9, 0, 0, Math.PI * 2); g.stroke(); }
    }
    // a follower on its way to be thrown at an enemy: the arc it will fly
    for (const a of (typeof followers !== "undefined" ? followers : [])) {
        const L = a && !a.dead ? a._launchLoad : null; if (!L || L.kind !== "combat" || !L.foe || L.foe.dead || !L.by) continue;
        const lift = typeof facilityLiftPx === "function" ? facilityLiftPx : () => 0;
        g.strokeStyle = "rgba(255,231,51,0.75)"; g.lineWidth = 2; g.setLineDash([6, 6]); g.beginPath();
        for (let i = 0; i <= 16; i++) { const q = _techArcScr(L.by.x, L.by.y, L.foe.x, L.foe.y, lift(L.by.x, L.by.y), lift(L.foe.x, L.foe.y), T.peak, i / 16); if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); }
        g.stroke(); g.setLineDash([]);
    }
    // the flyers' shadows on the floor under them (you too, carried by a launcher)
    for (const a of (typeof followers !== "undefined" ? followers : []).concat(_techRider() ? [_techRider()] : [])) {
        const F = a && !a.dead ? a._flight : null; if (!F) continue;
        const t = Math.min(1, Math.max(0, (f0 - F.t0) / F.dur)), q = _techArcScr(F.x0, F.y0, F.x1, F.y1, F.z0, F.z1, 0, t);
        g.globalAlpha = 0.35; g.fillStyle = "#000"; g.beginPath(); g.ellipse(q.x, q.y, 14 - 6 * Math.sin(Math.PI * t), 6 - 2 * Math.sin(Math.PI * t), 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    }
    // THE RUBBLE near you: what it is and what to do (the hole once it is drilled), and how far through a drilling is
    const rP = (r, z) => typeof _fpP === "function" ? _fpP(r.at[0], r.at[1], z) : [_techScr(r.at[0], r.at[1]).x, _techScr(r.at[0], r.at[1]).y + TILE_H - z];
    for (const r of _techRubbles()) {
        const d = Math.hypot(r.at[0] - player.visualX, r.at[1] - player.visualY); if (d > TECH_AB.drill.near) continue;
        const a = Math.min(1, (TECH_AB.drill.near - d) / 2), open = techRubbleOpen(r), p = rP(r, 0);
        if (open && !r.solid && _fp && (_fp.portals || []).some(q => q.rubble === r.id)) continue;   // (a hole that is a doorway, the Ant Nest's: the doorway's name is shown over it, js/facilityportals.js)
        const txt = open ? (r.solid ? (r.opened || "THE CHOKE IS DRILLED THROUGH · THE WAY IN IS OPEN") : "A DARK HOLE IN THE ROCK · SEALED FOR NOW") : _techDrilling(r) ? "✹ THERMITE DRILL · " + techRubbleLeft(r) + " TO GO" : (r.tag ? "✹ " + r.tag : r.solid ? "✹ CHOKED TUNNEL" : "✹ RUBBLE") + " · PRESS AND HOLD IT: THERMITE DRILL";
        g.globalAlpha = a; g.font = font(13); g.textAlign = "center"; g.textBaseline = "middle";
        const w = g.measureText(txt).width + 22, y = p[1] - 96 + Math.sin(f0 * 0.07) * 2, col = open ? "#9aa4b4" : "#ff9a4a";
        g.fillStyle = "rgba(5,8,18,0.82)"; g.fillRect(p[0] - w / 2, y - 12, w, 24); g.strokeStyle = col; g.lineWidth = 1.5; g.strokeRect(p[0] - w / 2 + 0.5, y - 11.5, w - 1, 23); g.fillStyle = col; g.fillText(txt, p[0], y + 1);
        if (!open && (_techRubbleHits()[r.id] || 0) > 0) {   // six ticks, the ones drilled lit
            const n = TECH_AB.drill.hits, done = _techRubbleHits()[r.id] || 0;
            for (let k = 0; k < n; k++) { g.fillStyle = k < done ? "#ffb070" : "rgba(255,176,112,0.25)"; g.fillRect(p[0] - n * 7 + k * 14 + 1, y + 16, 11, 5); }
        }
        g.globalAlpha = 1;
    }
    // A DRILL AT WORK: a jet of white-hot thermite from the technician to what it drills, sparks flying off where it bites
    for (const a of (typeof followers !== "undefined" ? followers : [])) {
        const W = a && !a.dead ? a._drill : null; if (!W || W.workAt === null) continue;
        const r = W.rubble ? _techRubble(W.rubble) : null, foe = W.foe;
        const from = _techScr(a.x, a.y), fx = from.x, fy = from.y + TILE_H - 26;
        let to = null; if (r) to = rP(r, 24); else if (foe && !foe.dead) { const s = _techScr(foe.x, foe.y); to = [s.x, s.y + TILE_H - 20]; }
        if (!to) continue;
        const pul = 0.6 + 0.4 * Math.sin(f0 * 0.9);
        g.globalCompositeOperation = "lighter"; g.lineCap = "round";
        g.strokeStyle = "rgba(255,120,40," + (0.35 * pul).toFixed(3) + ")"; g.lineWidth = 9; g.beginPath(); g.moveTo(fx, fy); g.lineTo(to[0], to[1]); g.stroke();
        g.strokeStyle = "rgba(255,240,200," + (0.9 * pul).toFixed(3) + ")"; g.lineWidth = 2.5; g.stroke();
        for (let k = 0; k < 5; k++) { const ang = (f0 * 0.37 + k * 1.3) % (Math.PI * 2), len = 6 + ((f0 + k * 7) % 12); g.strokeStyle = "rgba(255,200,90,0.8)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(to[0], to[1]); g.lineTo(to[0] + Math.cos(ang) * len, to[1] + Math.sin(ang) * len * 0.6 - 3); g.stroke(); }
        g.globalCompositeOperation = "source-over"; g.lineCap = "butt";
    }
    // A FROST PATCH's seconds, over its middle
    for (const P of techFrosts) {
        const left = P.until - f0; if (left <= 0) continue; const s = _techScr(P.x, P.y);
        g.globalAlpha = Math.min(1, left / 60); g.font = font(12); g.textAlign = "center"; g.fillStyle = "#e6f9ff"; g.fillText("❄ " + Math.ceil(left / 60), s.x, s.y + TILE_H - 14); g.globalAlpha = 1;
    }
    g.restore();
}
