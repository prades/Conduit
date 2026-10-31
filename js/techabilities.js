// ─────────────────────────────────────────────────────────
//  THE TECHNICIANS' ABILITIES (the Level 1 update): one table, one way in (docs/TECHNICIANS.md)
// ─────────────────────────────────────────────────────────
// ASKED: "Implement the complete Level 1 update for my existing Conduit game [...] all six Technician types and their Level 1 abilities [...] The HUD must use the same underlying ability logic as world interactions."
// A TECHNICIAN (role "camper", shown as TECHNICIAN) of an element has that element's ability, as an egg and evolved alike. Every way of using one goes through techAbilityUse: the chip on its card in the squad (js/party.js),
// a tap in the world, the tests. So a command from the HUD and one from the world are one thing, with one cooldown and the same checks, and only a technician that is in the squad uses one.
//   WAITS: the first use waits TECH_AB.joinWait after the technician joins the squad (the user: "the 60-second initial squad wait"), and each use after that waits that ability's cooldown (60 s for each of the six, as asked).
//     Cooldowns are not saved (none are).
//   THE SIX: ELECTRIC the KINETIC LAUNCHER, CORE the PHOTONIC SHIELD, FIRE the THERMITE DRILL, ICE the FROST PATCH, TOXIC the BLIGHT SPIDER, FLUX TELEGRAB (each below). docs/TECHNICIANS.md has their numbers, which were given
//     and which are provisional, and what is still to be decided.
//   AIMS: what a chip asks the player to pick, in order: a follower, an enemy (on the screen, or its card), a spot on the floor, an item on the floor.
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
//     up into the site's room (the Arena Catwalk), where it holds the room until it is called back (COME). The way down is the room's BROKEN SECTION: a follower that is not holding the room walks to it and drops through to the floor
//     under it, one way only. Nobody walks up: the catwalks stay shut to walking (tests/facility.js); the launcher is the only way up, and only a follower goes.

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
    },
    blight: {
        cooldown: 3600,     // 60 s from when its pool is down
        size: 2,            // tiles: 2 by 2 (given)
        max: 3,             // pools at once: a 4th takes the oldest's place (given)
        days: 2,            // a pool lasts two in-game days (given), fading as it is taken back in (reabsorbed)
        every: 30,          // frames between its bites at what stands in it: every half second (given)
        walk: 1200,         // frames to get to the spot, or it is called off
    },
    grab: {
        cooldown: 3600,     // 60 s
        flight: 40,         // frames an item flies to you
        peak: 60,           // px: its arc
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
                ask: () => "TAP THE FLOOR WHERE IT CAN SEE" },
    toxic:    { id: "blight_spider", name: "BLIGHT SPIDER", short: "POOL", icon: "☣", col: "#7dff4a", aim: ["spot"], use: (f, p) => techBlightAt(f, p.spot),
                ask: () => "TAP THE FLOOR WHERE IT CAN SEE: IT LEAVES A POOL THERE" },
    flux:     { id: "telegrab", name: "TELEGRAB", short: "GRAB", icon: "✦", col: "#c77dff", aim: ["item"], use: (f, p) => techGrabAt(f, p.item),
                ask: () => "TAP AN ITEM ON THE FLOOR, ANYWHERE" },
};

function _techFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _techSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 96, text, color: col || "#ffe733", life: 110, vy: -0.22, size: 13 }); }
function _techName(f) { return typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER"; }
function _techMember(f) { return typeof partyIsMember === "function" ? partyIsMember(f) : !!f && !f.dead; }

// ── who has which ability, and when it can be used ──
function techAbilityOf(f) { return f && f.isFollower && !f.isClone && f.role === "camper" ? TECH_ABILITIES[f.element] || null : null; }
function techReadyIn(f) { return Math.max(0, ((f && f._abReadyAt) || 0) - _techFrame()); }   // frames until it can use its ability again
function techAbilityCan(f) {
    const ab = techAbilityOf(f); if (!ab) return { ok: false, why: "NO ABILITY" };
    if (f.dead || f.returningToCrystal || f._flight) return { ok: false, why: "NOT HERE" };
    if (!_techMember(f)) return { ok: false, why: "NOT IN THE SQUAD" };
    if (f._abBusy) return { ok: false, why: "BUSY" };
    const w = techReadyIn(f); if (w > 0) return { ok: false, why: ab.short + " READY IN " + Math.ceil(w / 60) + " S" };
    return { ok: true, ab };
}
// THE ONE WAY IN (the HUD's chip, the world, the tests): { ok } or { ok: false, why }
function techAbilityUse(f, picks) {
    const c = techAbilityCan(f); if (!c.ok) return c;
    return c.ab.use(f, picks || {});
}

// ── the sites (the map's launchSites) and the launchers set up at them ──
function _techSites() { return (typeof _fp !== "undefined" && _fp && _fp.F && _fp.F.launchSites) || []; }
function _techSite(id) { return _techSites().find(s => s.id === id) || null; }
function _techInstalled() { if (!_fp.launchers) _fp.launchers = new Set(); return _fp.launchers; }
function techLauncherAt(id) { return typeof _fp !== "undefined" && !!_fp && _techInstalled().has(id); }
function techLaunchersSnapshot() { return typeof _fp !== "undefined" && _fp ? Array.from(_techInstalled()) : []; }
function techLaunchersApply(list) { if (typeof _fp === "undefined" || !_fp) return; const S = _techInstalled(); S.clear(); for (const id of (Array.isArray(list) ? list : [])) if (_techSite(id)) S.add(id); }
function _techComp(x, y) { return typeof _pComp === "function" ? _pComp(x, y) : undefined; }   // which stretch of floor a point is on (js/facilityportals.js)
function _techSiteBusy(s) { return typeof followers !== "undefined" && followers.some(a => a && !a.dead && ((a._launchLoad && a._launchLoad.site === s.id) || (a._flight && a._flight.site === s.id && a._flight.kind === "site"))); }
function _techSettingUp(s) { return typeof followers !== "undefined" && followers.some(a => a && !a.dead && a._siteWork && a._siteWork.site === s.id); }

// ── COMBAT: throw a follower at an enemy ──
function _techThrowable(g, by) { return !!g && !g.dead && g.isFollower === true && !g.isClone && g.team === "green" && g !== by && !g._flight && !g._launchLoad && !g._siteWork && !g.returningToCrystal; }
function _techFoeOk(foe) { return !!foe && !foe.dead && foe.team !== "green" && !foe.isClone && !(typeof isHostileTarget === "function" && !isHostileTarget(foe)); }
function techLaunchAt(tech, who, foe) {
    if (!_techThrowable(who, tech)) return { ok: false, why: who === tech ? "IT CANNOT THROW ITSELF" : "PICK A FOLLOWER TO THROW" };
    if (!_techFoeOk(foe)) return { ok: false, why: "PICK AN ENEMY" };
    if (typeof facilityLosFrom === "function" && !facilityLosFrom(tech.x, tech.y, foe.x, foe.y)) return { ok: false, why: "THE TECHNICIAN CANNOT SEE IT" };   // (thrown only at what it sees: never over a wall into another room)
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
function techSiteLaunch(s, who) {
    if (!s || !techLauncherAt(s.id)) return { ok: false, why: "NO LAUNCHER HERE YET" };
    if (_techSiteBusy(s)) return { ok: false, why: "THE LAUNCHER IS IN USE" };
    if (!_techThrowable(who, null)) return { ok: false, why: "PICK A FOLLOWER TO SEND UP" };
    if (_techComp(who.x, who.y) === _techComp(s.land[0], s.land[1])) return { ok: false, why: "IT IS UP THERE ALREADY" };
    if (typeof partyRoomFree === "function" && !partyRoomFree(s.to)) return { ok: false, why: "THE " + String(s.label || s.to).toUpperCase() + " IS FULL · " + partyRoomCap(s.to) + " OF " + partyRoomCap(s.to) };   // (a room's cap: js/party.js)
    who._launchLoad = { kind: "site", site: s.id, t0: _techFrame() }; who.job = null; who.attackOrder = null;
    _techSay("⚡ " + _techName(who) + " TO THE LAUNCHER", "#ffe733");
    return { ok: true };
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
    if (typeof facilityLosFrom === "function" && !facilityLosFrom(tech.x, tech.y, foe.x, foe.y)) return { ok: false, why: "THE TECHNICIAN CANNOT SEE IT" };
    const S = TECH_AB.shield, P = _techShieldPlace(tech, foe), f0 = _techFrame();
    const W = { id: ++_techShieldN, by: tech, x: P.cx, y: P.cy, nx: P.nx, ny: P.ny, u0: P.u0, u1: P.u1, t0: f0, until: f0 + S.life, hits: [] };
    techShields.push(W);
    if (typeof actors !== "undefined") for (const a of actors) if (_techStops(a)) _techShieldOut(W, a);   // (one caught on its line is put out on its own side)
    tech._abReadyAt = f0 + S.cooldown; tech._shieldHold = { id: W.id, x: P.hx, y: P.hy }; tech.attackOrder = null; tech.job = null;
    _techSay("◈ PHOTONIC SHIELD · " + Math.round(S.life / 60) + " S", "#5ff7e0");
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
    if (!techShields.length || !_techStops(a)) return;
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
    for (const r of _techRubbles()) { const n = o && Number.isFinite(o[r.id]) ? Math.max(0, Math.min(TECH_AB.drill.hits, o[r.id] | 0)) : 0; if (n) _fp.rubbleHits[r.id] = n; if (n >= TECH_AB.drill.hits) _techRocksOut(r, true); }
}
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
    const t = techs.find(f => techAbilityCan(f).ok) || techs[0], res = techAbilityUse(t, { rubble: r }); if (res.ok) res.tech = t;
    return res;
}
function _techDrillRubble(tech, r) {
    if (techRubbleOpen(r)) return { ok: false, why: "IT IS DRILLED THROUGH" };
    if (_techDrilling(r)) return { ok: false, why: "IT IS BEING DRILLED" };
    _techDrillStart(tech, { rubble: r.id }); return { ok: true };
}
function techDrillFoe(tech, foe) {
    if (!_techFoeOk(foe)) return { ok: false, why: "PICK AN ENEMY", again: true };
    if (typeof facilityLosFrom === "function" && !facilityLosFrom(tech.x, tech.y, foe.x, foe.y)) return { ok: false, why: "THE TECHNICIAN CANNOT SEE IT", again: true };
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
        if (!W.hits) f._abReadyAt = f0 + T.cooldown;   // (the cooldown starts at its first hit)
        W.hits++; W.next = f0 + T.every; const H = _techRubbleHits(); H[r.id] = (H[r.id] || 0) + 1;
        _techDrillFx(r.at[0], r.at[1]);
        if (H[r.id] >= T.hits) {
            const n = _techRocksOut(r, false); _techDrillStop(f, null);
            _techSay("✹ THE RUBBLE IS DRILLED THROUGH · A DARK HOLE" + (n ? " · " + n + " ROCKS" : ""), "#ff9a4a");
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
    if (!W.hits) f._abReadyAt = f0 + T.cooldown;
    W.hits++; W.next = f0 + T.every;
    const dmg = ((f.stats && f.stats.attack) || 5) * 0.25 * T.foeMult;
    if (typeof applyElementalDamage === "function") applyElementalDamage(foe, dmg, f, "fire"); else if (typeof applyDamage === "function") applyDamage(foe, dmg, f, "fire");
    _techDrillFx(foe.x, foe.y);
    if (W.hits >= T.foeHits || foe.dead) _techDrillStop(f, null);
}
// the rubble's ring (js/draw.js drawRadialMenu, js/input.js): THERMITE DRILL above, and what it says under the ring; null once it is a hole
function techRingFor(r) {
    if (!r || techRubbleOpen(r)) return null;
    const left = techRubbleLeft(r);
    return { up: { label: "THERMITE DRILL", act: "drill" }, caption: "RUBBLE · " + left + " HIT" + (left === 1 ? "" : "S") + " TO DRILL THROUGH" };
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
        if (near && !_fp.rubbleNear.has(r.id)) { _fp.rubbleNear.add(r.id); if (!techRubbleOpen(r)) _techSay("✹ RUBBLE IN THE ROCK · A FIRE TECHNICIAN CAN DRILL IT: PRESS AND HOLD IT", "#ff9a4a"); }
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
    if (typeof facilityStandOk === "function" && !facilityStandOk(cx, cy)) return { ok: false, why: "TAP THE FLOOR", again: true };
    if (typeof facilityLosFrom === "function" && !facilityLosFrom(tech.x, tech.y, cx, cy)) return { ok: false, why: "THE TECHNICIAN CANNOT SEE THERE", again: true };
    const T = TECH_AB.frost, f0 = _techFrame(), h = Math.floor(T.size / 2), tiles = new Set();
    for (let dx = -h; dx <= h; dx++) for (let dy = -h; dy <= h; dy++) { const x = cx + dx, y = cy + dy; if ((typeof facilityStandOk !== "function" || facilityStandOk(x, y)) && (typeof facilityLosFrom !== "function" || facilityLosFrom(cx, cy, x, y))) tiles.add(x + "," + y); }
    techFrosts.push({ x: cx, y: cy, tiles, t0: f0, until: f0 + T.life, by: tech });
    tech._abReadyAt = f0 + T.cooldown;
    _techSay("❄ FROST PATCH · " + Math.round(T.life / 60) + " S", "#9be8ff");
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "ring", x: cx, y: cy, radius: 1.6, color: "#9be8ff", life: 24 });
    return { ok: true };
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

// ── THE BLIGHT SPIDER (toxic) and THE PLAY CLOCK ──
// ASKED: "Create contamination pools. Make the pools persist for two complete in-game days. Implement gradual toxin reabsorption according to the established behavior. Use the existing day-cycle system rather than real-world timers.
// Prevent repeated updates from incorrectly extending pool duration or multiplying toxin reabsorption. Leave the death-spill behavior unresolved"; then: on a spot the player taps that it can see, the spider walks there and leaves a
// 2×2 pool; up to 3 (a 4th takes the oldest's place); 2 in-game days, a day being 20 minutes of play, play time only (a saved clock: nothing passes while the game is closed); the pool hurts enemies in it with the toxic cloud's own
// damage, every half second; reabsorption: the pool slowly fades, weaker and smaller, until it is gone. The death spill is not built.
//   THE PLAY CLOCK (`techClock`) counts the frames of play: it is saved, and a pool's age is the clock's, so a pool's time is the game's and not the wall's. Only the clock moves a pool on: its life is fixed when it is laid (born and
//   the clock), so nothing can stretch it, and its strength and size are worked out from its age each time (never taken off a little at a time), so nothing can make it fade faster.
let techClock = 0;    // frames of play (saved)
let techPools = [];   // { id, x, y (its middle), born (the clock), bite (its full bite), by }
let _techPoolN = 0;
function techPoolLife() { return TECH_AB.blight.days * TECH_AB.day; }
function techPoolFade(P) { return Math.max(0, 1 - (techClock - P.born) / techPoolLife()); }   // 1 when it is laid, 0 when it is gone
function techDayOf(t) { return Math.floor((t === undefined ? techClock : t) / TECH_AB.day) + 1; }
function techBlightAt(tech, spot) {
    if (!spot || !Number.isFinite(spot.x) || !Number.isFinite(spot.y)) return { ok: false, why: "TAP THE FLOOR", again: true };
    const ox = Math.round(spot.x - 0.5), oy = Math.round(spot.y - 0.5), x = ox + 0.5, y = oy + 0.5;   // the 2×2 block of tiles nearest the spot: ox..ox+1, oy..oy+1
    if (typeof facilityStandOk === "function" && !facilityStandOk(spot.x, spot.y)) return { ok: false, why: "TAP THE FLOOR", again: true };
    if (typeof facilityLosFrom === "function" && !facilityLosFrom(tech.x, tech.y, spot.x, spot.y)) return { ok: false, why: "THE TECHNICIAN CANNOT SEE THERE", again: true };
    tech._blight = { x, y, t0: _techFrame() }; tech._abBusy = { kind: "blight" }; tech.job = null; tech.attackOrder = null; tech._shieldHold = null;
    _techSay("☣ " + _techName(tech) + " GOES TO LAY A POOL", "#7dff4a");
    return { ok: true };
}
function _techPoolLay(f, x, y) {
    const T = TECH_AB.blight, bite = ((f.stats && f.stats.specialAttack) || 10) * 0.12 * 0.3;   // the toxic cloud's own bite (js/elements.js: a smoke bomb's cloud)
    techPools.push({ id: ++_techPoolN, x, y, born: techClock, bite, by: f.uid || null });
    while (techPools.length > T.max) techPools.shift();   // (a 4th takes the oldest's place)
    f._abReadyAt = _techFrame() + T.cooldown;
    _techSay("☣ BLIGHT POOL · " + techPools.length + " OF " + T.max + " · " + T.days + " DAYS", "#7dff4a");
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x, y, color: "#7dff4a", radius: 1.0, life: 24 });
}
function _techBlightWalkTick(f, f0) {
    const B = f._blight, T = TECH_AB.blight, stop = why => { f._blight = null; f._abBusy = null; f._fpWalkGoal = null; if (why) _techSay(why, "#ff8a6a"); };
    if (f.returningToCrystal || !_techMember(f)) return stop("THE POOL IS OFF");
    if (f0 - B.t0 > T.walk) return stop("THE POOL IS OFF · " + _techName(f) + " COULD NOT GET THERE");
    if (Math.hypot(B.x - f.x, B.y - f.y) <= 0.5) { stop(null); _techPoolLay(f, B.x, B.y); }
}
function techInPool(a, P) { const k = techPoolFade(P), h = TECH_AB.blight.size / 2 * k; return k > 0 && Math.abs(a.x - P.x) <= h && Math.abs(a.y - P.y) <= h; }
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

// ── TELEGRAB (flux) ──
// ASKED: "Implement the Level 1 Telegrab ability using existing targeting and item-interaction systems [...] its range, eligible targets, and retrieval behavior"; then: any item on the ground, at any distance (supply cases, scrap,
// capsules, rocks), pulled to the player and collected once through the existing pickup; shards stay paid at the kill.
//   The chip, then an item on the floor anywhere on the screen (the technician need not see it). It flies to you in an arc and is put at your feet, and the pickup you would have made walking over it takes it (a supply case or a drop:
//   js/facilitytutorial.js facilityPickupTick; a specimen capsule: js/specimen.js). Each item is taken once; one your pack has no room for stays at your feet, as it would.
let techGrabs = [];   // the items in flight: { kind: "pickup" | "capsule", o (the item), x0, y0, t0, by }
function _techGrabbable() {
    const out = [];
    if (typeof _fp !== "undefined" && _fp && _fp.items) for (const it of _fp.items) if (it.fp === "pickup" && !it.taken && !it.grab) out.push({ kind: "pickup", o: it });
    if (typeof cloneBodies !== "undefined") for (const b of cloneBodies) if (b && b.frozen && !b.grab) out.push({ kind: "capsule", o: b });
    return out;
}
// the item under a tap (the aim's "item"): its case or capsule on the floor, or the icon over it
function techItemAtScreen(ex, ey) {
    let best = null, bd = 46;
    for (const g of _techGrabbable()) {
        const p = _techScr(g.o.x, g.o.y), fy = p.y + TILE_H;
        const d = Math.min(Math.hypot(ex - p.x, ey - (fy - 8)), g.kind === "pickup" ? Math.hypot(ex - p.x, ey - (fy - 40)) : Infinity);
        if (d < bd) { bd = d; best = g; }
    }
    return best;
}
function techGrabAt(tech, item) {
    if (!item || !item.o) return { ok: false, why: "TAP AN ITEM ON THE FLOOR", again: true };
    const o = item.o, gone = item.kind === "pickup" ? o.taken : !(typeof cloneBodies !== "undefined" && cloneBodies.includes(o));
    if (gone || o.grab) return { ok: false, why: "IT IS GONE", again: true };
    const f0 = _techFrame(); o.grab = { by: tech, t0: f0 };
    techGrabs.push({ kind: item.kind, o, x0: o.x, y0: o.y, t0: f0, by: tech });
    tech._abReadyAt = f0 + TECH_AB.grab.cooldown;
    _techSay("✦ TELEGRAB · " + _techItemName(item), "#c77dff");
    return { ok: true };
}
function _techItemName(g) {
    if (g.kind === "capsule") return "A SPECIMEN CAPSULE";
    const id = g.o.items && g.o.items[0] && g.o.items[0][0], d = id && typeof itemDef === "function" ? itemDef(id) : null;
    return g.o.rock ? "A ROCK" : d ? d.name : "AN ITEM";
}
function _techGrabTick(f0) {
    if (!techGrabs.length) return;
    const T = TECH_AB.grab;
    techGrabs = techGrabs.filter(g => {
        const o = g.o, gone = g.kind === "pickup" ? o.taken : !(typeof cloneBodies !== "undefined" && cloneBodies.includes(o));
        if (gone) { o.grab = null; return false; }
        const t = Math.min(1, (f0 - g.t0) / T.flight);
        o.x = g.x0 + (player.x - g.x0) * t; o.y = g.y0 + (player.y - g.y0) * t;
        if (t < 1) return true;
        o.x = player.x; o.y = player.y; o.grab = null;   // at your feet: the pickup takes it
        if (g.kind === "pickup") { o.depth = o.x + o.y; const room = typeof partyRoomAt === "function" ? partyRoomAt(o.x, o.y) : null; if (room) { o.room = room; if (typeof facilityRoomHeight === "function" && typeof FP_ELEV_PX !== "undefined") o.base = facilityRoomHeight(room, _fp.F) * FP_ELEV_PX; } }
        return false;
    });
}

// everything the abilities keep for a game, let go when a new one starts or one is loaded (js/facilityplay.js facilityResetState). Saved and put back by the facility's save: the launchers, the rubble, the clock and the pools.
function techReset() { techShields = []; techFrosts = []; techPools = []; techGrabs = []; techClock = 0; techAim = null; _techLabels = {}; }

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
    a.job = null; a._fpPath = null; a._fpWalkGoal = null; a.state = "idle";
}
function _techThrow(a) {
    const L = a._launchLoad; a._launchLoad = null; a._fpWalkGoal = null; const T = TECH_AB.launch;
    if (L.kind === "site") { const s = _techSite(L.site); if (!s) return; _techFly(a, s.land[0], s.land[1], T.siteFlight, T.sitePeak, { kind: "site", site: s.id }); }
    else {
        const t = L.by, foe = L.foe, dx = t.x - foe.x, dy = t.y - foe.y, d = Math.hypot(dx, dy) || 1;
        let lx = foe.x + dx / d * 0.7, ly = foe.y + dy / d * 0.7;   // beside the enemy, on the thrower's side
        if (typeof facilityStandOk === "function" && !facilityStandOk(lx, ly) && typeof _fpNearestCell === "function") { const c = _fpNearestCell(lx, ly); if (c) { lx = c[0]; ly = c[1]; } }
        _techFly(a, lx, ly, T.flight, T.peak, { kind: "combat", by: t, foe });
        t._abBusy = null; t._abReadyAt = _techFrame() + T.cooldown;   // the cooldown starts as the follower leaves the ground
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
            if (typeof applyDamage === "function") applyDamage(foe, (a.power || 10) * T.powerMult, a);
            if (!F.xpDone && F.by && !F.by.dead && typeof gainXp === "function" && typeof killXp === "function") { F.xpDone = true; gainXp(F.by, killXp(foe)); }   // a throw that hits: the technician's XP, once
            if (!foe.dead) a.attackOrder = { target: foe, until: _techFrame() + 600 };   // (it fights the one it was thrown at)
            if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: a.x, y: a.y, text: "⚡ KINETIC IMPACT", color: "#ffe733", life: 60, vy: -0.06, size: 12 });
        } else if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: a.x, y: a.y, text: "MISSED", color: "#8aa0c8", life: 50, vy: -0.06, size: 11 });
        if (typeof applyDamage === "function") applyDamage(a, T.selfDamage, null, null, false, true);   // the set amount, hit or miss: it comes down hard (fixed: no defense changes it; no hit takes more than the cap)
        if (typeof shake !== "undefined") shake = Math.max(shake || 0, hit ? 6 : 3);
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: a.x, y: a.y, color: "#ffe733", radius: 0.9, life: 24 });
    } else if (F.kind === "site") {
        const s = _techSite(F.site);
        if (s && typeof partyPost === "function") partyPost(a, s.to, true);   // it holds the room up there until it is called back
        if (s) _techSay("⚡ " + _techName(a) + " IS ON THE " + String(s.label || s.to).toUpperCase() + " · COME BRINGS IT BACK", "#ffe733");
    }
    if (typeof elementEffects !== "undefined" && F.kind !== "combat") elementEffects.push({ type: "ring", x: a.x, y: a.y, radius: 0.7, color: "#ffe733", life: 18 });
}

// ── a follower walking to the launcher, to a site it is setting up, or to a broken section (js/npc.js updateRTSNPC asks first): true when this moved it ──
function techStepWants(a) { return !!(a && (a._launchLoad || a._siteWork || a._dropSite || a._shieldHold || a._drill || a._blight)); }
function _techFace(a, x, y) { const dx = x - a.x, dy = y - a.y, d = Math.hypot(dx, dy); if (d > 1e-6) { a.dirX = dx / d; a.dirY = dy / d; } }
function techStepOverride(a) {
    let pt = null;
    if (a._launchLoad) pt = _techLoadPoint(a);
    else if (a._siteWork) { const s = _techSite(a._siteWork.site); if (s) { if (a._siteWork.workAt !== null) { a._fpWalkGoal = null; return true; } pt = s.at; } }   // (at work: it stands still)
    else if (a._dropSite) { const s = _techSite(a._dropSite); if (s) pt = s.drop; }
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
    if (!pt) { a._fpWalkGoal = null; return false; }
    a._fpWalkGoal = { x: pt[0], y: pt[1] };   // (the facility's routing walks it round walls to here: js/facilityplay.js _fpGoals)
    const dx = pt[0] - a.x, dy = pt[1] - a.y, d = Math.hypot(dx, dy);
    if (d > 0.05 && typeof _walkStep === "function") _walkStep(a, dx, dy, d);
    return true;
}

// ── each frame (js/game.js): first waits, throws, set-ups, the broken sections, the sites' notices ──
function techAbilityTick() {
    if (typeof _fp === "undefined" || !_fp || typeof followers === "undefined") return;
    const f0 = _techFrame(), T = TECH_AB.launch;
    for (const f of followers) {
        if (!f || f.dead) continue;
        const m = !!techAbilityOf(f) && _techMember(f);
        if (m && !f._abMember) f._abReadyAt = Math.max(f._abReadyAt || 0, f0 + TECH_AB.joinWait);   // it has just joined the squad: the first wait
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
        if (f._dropSite && !f._flight) {
            const s = _techSite(f._dropSite);
            if (s && Math.hypot(s.drop[0] - f.x, s.drop[1] - f.y) <= 0.5) { f._dropSite = null; f._fpWalkGoal = null; _techFly(f, s.dropTo[0], s.dropTo[1], T.dropFlight, 14, { kind: "drop", site: s.id }); }
        }
        if (f._drill) _techDrillTick(f, f0);
        if (f._blight) _techBlightWalkTick(f, f0);
    }
    if (f0 % 15 === 3) _techDropScan();
    _techSiteNotices(); _techRubbleNotices();
    _techShieldTick();
    techClock++;   // THE PLAY CLOCK: a frame of play
    _techFrostTick(f0); _techPoolTick(); _techGrabTick(f0);
}
// THE BROKEN SECTIONS: a follower on a site's room that is not holding it (it was called back) walks to the room's broken section and drops through; one posted to that room that is not up there (it came back from the dead at the
// Crystal) is let go of its post, since nobody walks up
function _techDropScan() {
    const sites = _techSites(); if (!sites.length) return;
    const pc = _techComp(player.x, player.y);
    for (const f of followers) {
        if (!f || f.dead || f.isClone || f._flight || f._launchLoad || f._siteWork) continue;
        const fc = _techComp(f.x, f.y); f._dropSite = null;
        for (const s of sites) {
            const sc = _techComp(s.land[0], s.land[1]); if (sc === undefined) continue;
            if (f.post === s.to && fc !== sc) { if (typeof partyCall === "function" && !partyCall(f, true) && typeof partyPost === "function" && typeof partyRoomOf === "function") partyPost(f, partyRoomOf(f), true); break; }
            if (fc === sc && sc !== pc && !f.post && !f.job && !f.returningToCrystal) { f._dropSite = s.id; break; }
        }
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
let techAim = null;   // { mode: "combat" | "site", f, ab, site, step, picks }
let _techLabels = {};  // where each site's label was drawn last (a tap on it is a tap on the site): drawing's, not the game's state
function techAimActive() { return !!techAim; }
function techAimNeed() { const A = techAim; if (!A) return null; return A.mode === "site" ? "follower" : A.ab.aim[A.step] || null; }
function techAimPrompt() {
    const A = techAim; if (!A) return "";
    if (A.mode === "site") { const s = _techSite(A.site); return "KINETIC LAUNCHER · TAP A FOLLOWER TO SEND UP TO THE " + String(s ? s.label || s.to : "").toUpperCase(); }
    const need = techAimNeed();
    return A.ab.name + " · " + (need && A.ab.ask ? A.ab.ask(need, A.picks) : "");
}
function _techAimShow() {
    if (typeof document === "undefined" || !document.body || !document.body.classList) return;
    document.body.classList.toggle("tech-aiming", !!techAim);
    const el = document.getElementById ? document.getElementById("techAim") : null, t = el && el.querySelector ? el.querySelector(".ta-t") : null;
    if (t) t.textContent = techAimPrompt();
    if (typeof partyBarRender === "function") partyBarRender(true);
}
// the chip on a technician's squad card (js/party.js)
function techChipTap(f) {
    if (techAim && techAim.f === f) { techAimCancel(); return false; }
    const c = techAbilityCan(f); if (!c.ok) { _techSay(c.why, "#ff8a6a"); return false; }
    techAim = { mode: "combat", f, ab: c.ab, site: null, step: 0, picks: {} }; _techAimShow();
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
// the last pick of an aim (an enemy, a spot, an item): the ability is used; one that can be picked again (out of sight, not floor) keeps the aim up
function _techAimLast(kind, v) {
    const A = techAim; if (!A || techAimNeed() !== kind) return false;
    A.picks[kind] = v; const r = techAbilityUse(A.f, A.picks);
    if (!r.ok) { _techSay(r.why, "#ff8a6a"); if (r.again || r.why === "THE TECHNICIAN CANNOT SEE IT" || r.why === "PICK AN ENEMY") { A.picks[kind] = null; return true; } }   // (another can be picked)
    techAimCancel(true);
    return true;
}
function techAimPickEnemy(e) { return _techAimLast("enemy", e); }
function techAimPickSpot(p) { return _techAimLast("spot", p); }
function techAimPickItem(g) { return _techAimLast("item", g); }
// the floor under a point on the screen (as a tap walks the player there: js/input.js handleInput), not rounded to a tile
function techScreenToWorld(ex, ey) {
    const dx = ex - canvas.width / 2, dy = ey + (typeof facilityPickLift === "function" ? facilityPickLift(ex, ey) : 0) - canvas.height / 2 - TILE_H;
    return { x: (dy / TILE_H + dx / TILE_W) / 2 + player.visualX, y: (dy / TILE_H - dx / TILE_W) / 2 + player.visualY };
}
// a tap on the world while aiming (js/input.js asks first): always the aim's
function techAimTap(x, y) {
    if (!techAim) return false;
    const need = techAimNeed();
    if (need === "follower") { const g = typeof findFollowerAtScreen === "function" ? findFollowerAtScreen(x, y) : null; if (g && !g.isClone) return techAimPickFollower(g); if (techAim.mode === "site") { techAimCancel(true); return false; } _techSay("TAP A FOLLOWER", "#8aa0c8"); return true; }   // (the launcher's aim never holds you: a tap elsewhere puts it away and walks, js/input.js)
    if (need === "enemy") { const e = typeof findEnemyAtScreen === "function" ? findEnemyAtScreen(x, y) : null; if (e) return techAimPickEnemy(e); _techSay("TAP AN ENEMY", "#8aa0c8"); return true; }
    if (need === "spot") return techAimPickSpot(techScreenToWorld(x, y));
    if (need === "item") { const g = techItemAtScreen(x, y); if (g) return techAimPickItem(g); _techSay("TAP AN ITEM ON THE FLOOR", "#8aa0c8"); return true; }
    return true;
}
// a tap on a site (js/input.js handleInput): set a launcher up there, or send a follower up from the one there; true when it was a site's
function techSiteTap(ex, ey) {
    if (typeof _fp === "undefined" || !_fp || typeof player === "undefined") return false;
    for (const s of _techSites()) {
        if (Math.hypot(s.at[0] - player.visualX, s.at[1] - player.visualY) > TECH_AB.launch.near) continue;
        const lr = _techLabels[s.id], onLabel = lr && ex >= lr.x && ex <= lr.x + lr.w && ey >= lr.y && ey <= lr.y + lr.h;
        if (!onLabel) continue;   // (only its tag takes a tap: a tap on the floor round it, to walk past, is a walk)
        if (techLauncherAt(s.id)) {
            if (_techSiteBusy(s)) { _techSay("THE LAUNCHER IS IN USE", "#ff8a6a"); return true; }
            techAim = { mode: "site", f: null, ab: TECH_ABILITIES.electric, site: s.id, step: 0, picks: {} }; _techAimShow();
            return true;
        }
        const r = techSiteSetup(s);
        _techSay(r.ok ? "⚡ " + _techName(r.tech) + " IS SETTING UP A KINETIC LAUNCHER" : r.why, r.ok ? "#ffe733" : "#ff8a6a");
        return true;
    }
    return false;
}
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => { if (e && e.key === "Escape" && techAim) techAimCancel(); }); } catch (e) { /* no window: the tests */ }

// ── the chip on a technician's squad card (js/party.js partySlotsUpdate): { text, cls } or null ──
function techChipState(f) {
    const ab = techAbilityOf(f); if (!ab) return null;
    const ic = ab.icon || "⚡";
    if (techAim && techAim.f === f) return { text: "✕ AIMING", cls: "aim" };
    if (f._abBusy) return { text: ic + " " + ({ setup: "SETTING UP", combat: "THROWING", drill: "DRILLING", blight: "LAYING" }[f._abBusy.kind] || "BUSY"), cls: "busy" };
    const w = techReadyIn(f); if (w > 0) return { text: ic + " " + Math.ceil(w / 60) + " S", cls: "wait" };
    return { text: ic + " " + ab.short, cls: "ready" };
}

// ── the INFO card's ABILITY section (js/unitinfo.js): what it does, its numbers (the provisional ones too), and when it is ready ──
function techAbilityInfo(f) {
    const ab = techAbilityOf(f); if (!ab) return null;
    const w = techReadyIn(f), ready = f._abBusy ? "BUSY" : w > 0 ? "IN " + Math.ceil(w / 60) + " S" : _techMember(f) ? "NOW" : "IN THE SQUAD ONLY";
    if (ab.id === "kinetic_launcher") {
        const T = TECH_AB.launch;
        return { h: "ABILITY · " + ab.name, note: "From the ⚡ chip on its squad card: throw a follower at an enemy it can see. At a launcher site it sets a launcher up for good, which sends followers up to where nobody can walk (the Arena Catwalk).",
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
        return { h: "ABILITY · " + ab.name, note: "From the ❄ chip on its squad card: a patch of ice on a spot of floor it can see, there at once. Enemies on it are slowed; your units cross it faster.",
                 rows: [["SIZE", R.size + " × " + R.size + " tiles"], ["LASTS", Math.round(R.life / 60) + " s"], ["ENEMIES ON IT", Math.round(R.slow * 100) + "% of their speed"], ["YOUR UNITS ON IT", Math.round(R.boost * 100) + "% of their speed"]].concat(wait) };
    }
    if (ab.id === "blight_spider") {
        const B = TECH_AB.blight, bite = Math.round(((f.stats && f.stats.specialAttack) || 10) * 0.12 * 0.3 * 100) / 100;
        return { h: "ABILITY · " + ab.name, note: "From the ☣ chip on its squad card: it walks to a spot of floor it can see and leaves a poison pool. The pool hurts enemies standing in it, and is slowly taken back in: weaker and smaller until it is gone.",
                 rows: [["POOL", B.size + " × " + B.size + " tiles, up to " + B.max + " (a new one takes the oldest's place)"], ["LASTS", B.days + " in-game days (" + Math.round(B.days * TECH_AB.day / 3600) + " min of play)"], ["BITE", bite + " every " + (B.every / 60) + " s, fading with the pool"], ["POOLS NOW", techPools.length + " · DAY " + techDayOf()]].concat(wait) };
    }
    if (ab.id === "telegrab") {
        return { h: "ABILITY · " + ab.name, note: "From the ✦ chip on its squad card: an item on the floor anywhere on your screen flies to you and is picked up, as if you had walked over it.",
                 rows: [["REACH", "anywhere on the screen"], ["ITEMS", "supply cases, drops, capsules, rocks"]].concat(wait) };
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
    const P = (u, z) => _fpWP(it, u, z), poly = (pts, fill, stroke, lw) => { ctx.beginPath(); pts.forEach((q, i) => { const p = P(q[0], q[1]); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.lineJoin = "round"; ctx.stroke(); } };
    ctx.save();
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
    poly([[0.08, 0], [0.12, 30], [0.3, 52], [0.55, 58], [0.8, 48], [0.94, 26], [0.95, 0]], "#2a1e18", null);   // the dark gap the pile fills
    const shades = ["#a8967e", "#8e7c66", "#bba98f", "#9a8670"];
    for (let k = 0; k < Math.min(show, _TECH_RUBBLE.length); k++) {
        const [uc, zb, w, h] = _TECH_RUBBLE[k], j = ((it.seed >>> k) % 5) * 0.012, pts = [[uc - w / 2, zb + h * 0.1], [uc - w * 0.42, zb + h * 0.7], [uc - w * 0.1 + j, zb + h], [uc + w * 0.32, zb + h * 0.86], [uc + w / 2, zb + h * 0.3], [uc + w * 0.22, zb]];
        poly(pts, shades[(k + it.seed) % shades.length], "#0b2a2f", 2.5);
        poly([pts[1], pts[2], pts[3], [uc, zb + h * 0.62]], "rgba(255,255,255,0.13)", null);   // the lit top
    }
    if (show > 4) { poly([[0.28, 6], [0.3, 13], [0.72, 23], [0.7, 16]], "#c9c2b4", "#0b2a2f", 2); for (let s = 0; s < 4; s++) poly([[0.34 + s * 0.09, 7.4 + s * 2.3], [0.37 + s * 0.09, 14.2 + s * 2.3], [0.4 + s * 0.09, 14.9 + s * 2.3], [0.37 + s * 0.09, 8.1 + s * 2.3]], "#ffd21a", null); }   // a cracked slab across it, hazard-painted
    // the seams between the stones: dull at first, glowing hotter with each hit
    ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    const glow = 0.25 + 0.75 * heat, pul = 0.75 + 0.25 * Math.sin(f * 0.15);
    for (const seam of [[[0.32, 0], [0.33, 14], [0.46, 26], [0.5, 40]], [[0.58, 0], [0.6, 18], [0.7, 30]], [[0.2, 20], [0.36, 36], [0.44, 50]]]) {
        ctx.strokeStyle = "rgba(255,120,40," + (0.22 * glow * pul).toFixed(3) + ")"; ctx.lineWidth = 7; ctx.beginPath(); seam.forEach((q, i) => { const p = P(q[0], q[1]); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke();
        ctx.strokeStyle = "rgba(255,190,90," + (0.5 * glow * pul).toFixed(3) + ")"; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over"; ctx.lineCap = "butt";
    ctx.restore();
}
// ── on each floor tile (js/game.js draws it with the tile, like the serum's pools): the FROST PATCH's ice, the BLIGHT SPIDER's pools ──
function techDrawOnTile(tx, ty, px, py) {
    if (!techFrosts.length && !techPools.length) return;
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
    for (const P of techPools) {
        const k = techPoolFade(P), h = TECH_AB.blight.size / 2 * k; if (k <= 0 || Math.abs(tx - P.x) > h + 0.5 || Math.abs(ty - P.y) > h + 0.5) continue;
        const a = 0.35 + 0.55 * k, wob = 1 + 0.04 * Math.sin(f0 * 0.05 + P.id), c = S(P.x, P.y), R = h * Math.SQRT2 * wob;
        g.save(); tile(); g.clip();
        // a puddle, not a square: the pool's own round, three spills off its edge (where they go is the pool's own), a darker heart
        const blob = (x, y, r, fill, stroke) => { const q = S(x, y); g.beginPath(); g.ellipse(q[0], q[1], r * W, r * H, 0, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 2; g.stroke(); } };
        const lip = "rgba(170,255,90," + (0.7 * a).toFixed(3) + ")", body = "rgba(70,170,40," + (0.62 * a).toFixed(3) + ")";
        for (let s = 0; s < 3; s++) { const an = (P.id * 2.3 + s * 2.1) % (Math.PI * 2); blob(P.x + Math.cos(an) * h * 0.75, P.y + Math.sin(an) * h * 0.75, R * 0.42, body, lip); }
        g.beginPath(); g.ellipse(c[0], c[1], R * W * 0.92, R * H * 0.92, 0, 0, Math.PI * 2); g.fillStyle = body; g.fill(); g.strokeStyle = lip; g.lineWidth = 2; g.stroke();
        g.beginPath(); g.ellipse(c[0], c[1], R * W * 0.45, R * H * 0.45, 0, 0, Math.PI * 2); g.fillStyle = "rgba(30,90,20," + (0.45 * a).toFixed(3) + ")"; g.fill();
        const seed = ((tx * 73856093) ^ (ty * 19349663) ^ P.id) >>> 0;   // bubbles rising and popping
        for (let b = 0; b < 2; b++) { const ph = ((f0 + seed % 97 + b * 41) % 70) / 70, q = S(tx + (((seed >>> (b * 3)) % 9) - 4) / 12, ty + (((seed >>> (b * 3 + 1)) % 9) - 4) / 12); g.globalAlpha = 0.6 * a * (1 - ph); g.strokeStyle = "#d6ff9a"; g.lineWidth = 1; g.beginPath(); g.arc(q[0], q[1] - ph * 8, 1.5 + ph * 2.5, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
        g.restore();
    }
}
// the launchers and the broken sections stand among everything else (js/game.js sorts them by depth)
function techDrawItems(list) {
    if (typeof _fp === "undefined" || !_fp) return;
    for (const s of _techSites()) {
        if (techLauncherAt(s.id)) list.push({ type: "tech", kind: "launcher", x: s.at[0], y: s.at[1], site: s });
        list.push({ type: "tech", kind: "broken", x: s.drop[0], y: s.drop[1], site: s });
    }
    // a Photonic Shield, in pieces half a tile long, so what stands behind it is drawn behind it and what stands in front, in front
    for (const W of techShields) {
        if (!_techShieldOn(W)) continue;
        const n = Math.max(1, Math.ceil((W.u1 - W.u0) / 0.5)), du = (W.u1 - W.u0) / n;
        for (let i = 0; i < n; i++) { const ua = W.u0 + du * i, ub = ua + du, um = (ua + ub) / 2; list.push({ type: "tech", kind: "shield", x: W.x - W.ny * um, y: W.y + W.nx * um, W, ua, ub, first: i === 0, last: i === n - 1 }); }
    }
}
function techDrawItem(o, px, py) {
    const g = ctx, f0 = _techFrame();
    g.save();
    if (o.kind === "launcher") {
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
    } else if (o.kind === "broken") {
        // the catwalk's broken section: a hole torn in the grating, its bent edges, hazard paint either side
        g.fillStyle = "#030406"; g.beginPath(); g.moveTo(px - 18, py - 2); g.lineTo(px - 6, py - 10); g.lineTo(px + 3, py - 7); g.lineTo(px + 17, py - 1); g.lineTo(px + 6, py + 8); g.lineTo(px - 4, py + 6); g.closePath(); g.fill();
        g.strokeStyle = "#5b6275"; g.lineWidth = 1.5; g.stroke();
        g.strokeStyle = "#ffd21a"; g.lineWidth = 3;
        for (const k of [-1, 1]) { g.beginPath(); g.moveTo(px + k * 21, py - 10); g.lineTo(px + k * 27, py - 7); g.stroke(); g.beginPath(); g.moveTo(px + k * 23, py + 2); g.lineTo(px + k * 29, py + 5); g.stroke(); }
        g.fillStyle = "#ffd21a"; g.font = (typeof uiFont === "function" ? uiFont(11) : "bold 11px sans-serif"); g.textAlign = "center"; g.fillText("▼", px, py - 13 + Math.sin(f0 * 0.08) * 2);
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
    for (const s of _techSites()) {
        const d = Math.hypot(s.at[0] - player.visualX, s.at[1] - player.visualY); if (d > T.near) continue;
        const p = _techScr(s.at[0], s.at[1]), a = Math.min(1, (T.near - d) / 2), on = techLauncherAt(s.id);
        if (!on) {   // the spot it can stand on: a faint dashed outline (subtle: no fill, no pulse)
            g.globalAlpha = a * 0.45; g.strokeStyle = "#ffe733"; g.lineWidth = 1.5; g.setLineDash([5, 6]); g.beginPath(); g.moveTo(p.x, p.y - TILE_H); g.lineTo(p.x + TILE_W, p.y); g.lineTo(p.x, p.y + TILE_H); g.lineTo(p.x - TILE_W, p.y); g.closePath(); g.stroke(); g.setLineDash([]);
        }
        const work = (typeof followers !== "undefined" ? followers : []).find(q => q && !q.dead && q._siteWork && q._siteWork.site === s.id && q._siteWork.workAt !== null);
        if (work) { const k = Math.min(1, (f0 - work._siteWork.workAt) / T.setup); g.globalAlpha = 1; g.strokeStyle = "#ffe733"; g.lineWidth = 4; g.beginPath(); g.arc(p.x, p.y - 30, 16, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); g.stroke(); }
        // its TAG: small and quiet (ASKED: "it should remain subtle and uninterruptive"); a tap on it is the only tap the site takes
        const txt = on ? "⚡ LAUNCHER · SEND UP" : work || _techSettingUp(s) ? "⚡ SETTING UP" : "⚡ LAUNCHER SITE";
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
    // the flyers' shadows on the floor under them
    for (const a of (typeof followers !== "undefined" ? followers : [])) {
        const F = a && !a.dead ? a._flight : null; if (!F) continue;
        const t = Math.min(1, Math.max(0, (f0 - F.t0) / F.dur)), q = _techArcScr(F.x0, F.y0, F.x1, F.y1, F.z0, F.z1, 0, t);
        g.globalAlpha = 0.35; g.fillStyle = "#000"; g.beginPath(); g.ellipse(q.x, q.y, 14 - 6 * Math.sin(Math.PI * t), 6 - 2 * Math.sin(Math.PI * t), 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    }
    // THE RUBBLE near you: what it is and what to do (the hole once it is drilled), and how far through a drilling is
    const rP = (r, z) => typeof _fpP === "function" ? _fpP(r.at[0], r.at[1], z) : [_techScr(r.at[0], r.at[1]).x, _techScr(r.at[0], r.at[1]).y + TILE_H - z];
    for (const r of _techRubbles()) {
        const d = Math.hypot(r.at[0] - player.visualX, r.at[1] - player.visualY); if (d > TECH_AB.drill.near) continue;
        const a = Math.min(1, (TECH_AB.drill.near - d) / 2), open = techRubbleOpen(r), p = rP(r, 0);
        const txt = open ? "A DARK HOLE IN THE ROCK · SEALED FOR NOW" : _techDrilling(r) ? "✹ THERMITE DRILL · " + techRubbleLeft(r) + " TO GO" : "✹ RUBBLE · PRESS AND HOLD IT: THERMITE DRILL";
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
    // TELEGRAB: each item in flight, up in an arc to you, glowing violet, and a thread of light back to the flux technician
    for (const G of techGrabs) {
        const o = G.o, t = Math.min(1, Math.max(0, (f0 - G.t0) / TECH_AB.grab.flight)), q = _techArcScr(G.x0, G.y0, player.x, player.y, 0, 0, TECH_AB.grab.peak, t);
        const qx = q.x, qy = q.y + TILE_H - 18;
        if (G.by && !G.by.dead) { const b = _techScr(G.by.x, G.by.y); g.strokeStyle = "rgba(199,125,255,0.45)"; g.lineWidth = 1.5; g.setLineDash([4, 5]); g.lineDashOffset = -f0; g.beginPath(); g.moveTo(b.x, b.y + TILE_H - 30); g.lineTo(qx, qy); g.stroke(); g.setLineDash([]); g.lineDashOffset = 0; }
        g.globalCompositeOperation = "lighter"; const gr = g.createRadialGradient(qx, qy, 0, qx, qy, 22); gr.addColorStop(0, "rgba(199,125,255,0.55)"); gr.addColorStop(1, "rgba(199,125,255,0)"); g.fillStyle = gr; g.beginPath(); g.arc(qx, qy, 22, 0, Math.PI * 2); g.fill(); g.globalCompositeOperation = "source-over";
        const id = G.kind === "pickup" && o.items && o.items[0] ? o.items[0][0] : "specimen_capsule";
        if (typeof invDrawIcon === "function") invDrawIcon(id, qx, qy, 24, f0); else { g.fillStyle = "#c77dff"; g.fillRect(qx - 6, qy - 6, 12, 12); }
    }
    g.restore();
}
