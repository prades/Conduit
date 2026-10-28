// ─────────────────────────────────────────────────────────
//  THE TECHNICIANS' ABILITIES (the Level 1 update): one table, one way in (docs/TECHNICIANS.md)
// ─────────────────────────────────────────────────────────
// ASKED: "Implement the complete Level 1 update for my existing Conduit game [...] all six Technician types and their Level 1 abilities [...] The HUD must use the same underlying ability logic as world interactions."
// A TECHNICIAN (role "camper", shown as TECHNICIAN) of an element has that element's ability, as an egg and evolved alike. Every way of using one goes through techAbilityUse: the chip on its card in the squad (js/party.js),
// a tap in the world, the tests. So a command from the HUD and one from the world are one thing, with one cooldown and the same checks, and only a technician that is in the squad uses one.
//   WAITS: the first use waits TECH_AB.joinWait after the technician joins the squad (the user: "the 60-second initial squad wait"), and each use after that waits that ability's cooldown. Cooldowns are not saved (none are).
//   BUILT: ELECTRIC, the KINETIC LAUNCHER (below). The other five come as each one's design is settled; docs/TECHNICIANS.md lists what is still to be decided for each.
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
        siteXp: 100,        // PROVISIONAL: the XP for setting a launcher up (a level-5 scout's kill: js/levels.js XP_YIELD)
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
};

// The ability of each element's technician: its name, the word and the mark on its chip, what the player picks for it (in order), what the prompt asks for each pick, and what it does with them.
const TECH_ABILITIES = {
    electric: { id: "kinetic_launcher", name: "KINETIC LAUNCHER", short: "LAUNCH", icon: "⚡", col: "#ffe733", aim: ["follower", "enemy"], use: (f, p) => techLaunchAt(f, p.follower, p.enemy),
                ask: (need, p) => need === "follower" ? "TAP A FOLLOWER TO THROW" : "TAP AN ENEMY TO THROW " + _techName(p.follower) + " AT" },
    core:     { id: "photonic_shield", name: "PHOTONIC SHIELD", short: "SHIELD", icon: "◈", col: "#5ff7e0", aim: ["enemy"], use: (f, p) => techShieldAt(f, p.enemy),
                ask: () => "TAP THE CREATURE (OR ITS CARD) TO SHIELD AGAINST" },
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
// everything the abilities keep for a game, let go when a new one starts or one is loaded (js/facilityplay.js facilityResetState): nothing here is saved but the launchers, which the facility keeps
function techReset() { techShields = []; techAim = null; _techLabels = {}; }

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
    }
    if (f0 % 15 === 3) _techDropScan();
    _techSiteNotices();
    _techShieldTick();
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
        if (near && !_fp.siteNear.has(s.id)) {
            _fp.siteNear.add(s.id);
            _techSay(techLauncherAt(s.id) ? "⚡ KINETIC LAUNCHER · TAP IT TO SEND A FOLLOWER UP TO THE " + String(s.label || s.to).toUpperCase() : "⚡ A KINETIC LAUNCHER CAN BE SET UP HERE · TAP THE MARKED SPOT", "#ffe733");
        } else if (!near) _fp.siteNear.delete(s.id);
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
function techAimPickEnemy(e) {
    const A = techAim; if (!A || techAimNeed() !== "enemy") return false;
    A.picks.enemy = e; const r = techAbilityUse(A.f, A.picks);
    if (!r.ok) { _techSay(r.why, "#ff8a6a"); if (r.why === "THE TECHNICIAN CANNOT SEE IT" || r.why === "PICK AN ENEMY") { A.picks.enemy = null; return true; } }   // (another enemy can be picked)
    techAimCancel(true);
    return true;
}
// a tap on the world while aiming (js/input.js asks first): always the aim's
function techAimTap(x, y) {
    if (!techAim) return false;
    const need = techAimNeed();
    if (need === "follower") { const g = typeof findFollowerAtScreen === "function" ? findFollowerAtScreen(x, y) : null; if (g && !g.isClone) return techAimPickFollower(g); _techSay("TAP A FOLLOWER", "#8aa0c8"); return true; }
    if (need === "enemy") { const e = typeof findEnemyAtScreen === "function" ? findEnemyAtScreen(x, y) : null; if (e) return techAimPickEnemy(e); _techSay("TAP AN ENEMY", "#8aa0c8"); return true; }
    return true;
}
// a tap on a site (js/input.js handleInput): set a launcher up there, or send a follower up from the one there; true when it was a site's
function techSiteTap(ex, ey) {
    if (typeof _fp === "undefined" || !_fp || typeof player === "undefined") return false;
    for (const s of _techSites()) {
        if (Math.hypot(s.at[0] - player.visualX, s.at[1] - player.visualY) > TECH_AB.launch.near) continue;
        const p = _techScr(s.at[0], s.at[1]), lr = _techLabels[s.id];
        const onLabel = lr && ex >= lr.x && ex <= lr.x + lr.w && ey >= lr.y && ey <= lr.y + lr.h;
        if (!onLabel && Math.hypot(ex - p.x, ey - (p.y - 10)) > 60) continue;
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
    if (f._abBusy) return { text: ic + " " + (f._abBusy.kind === "setup" ? "SETTING UP" : f._abBusy.kind === "combat" ? "THROWING" : "BUSY"), cls: "busy" };
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
    return { h: "ABILITY · " + ab.name, note: "", rows: [["READY", ready]] };
}

// ── drawing ──
function _techScr(x, y) { return { x: (x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, y: (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 - (typeof facilityLiftRel === "function" ? facilityLiftRel(x, y) : 0) }; }
// a point on a flight's arc, on the screen (`z0`/`z1`: the floors' heights at its ends, px; `peak`: the arc's height)
function _techArcScr(x0, y0, x1, y1, z0, z1, peak, t) {
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, cam = typeof _fpCam !== "undefined" ? _fpCam : 0;
    return { x: (x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, y: (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 - (z0 + (z1 - z0) * t - cam) - peak * 4 * t * (1 - t) };
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
        if (!on) {   // the spot it can stand on, highlighted
            const k = 0.55 + 0.45 * Math.sin(f0 * 0.1);
            g.globalAlpha = a * (0.35 + 0.35 * k); g.fillStyle = "#ffe733"; g.beginPath(); g.moveTo(p.x, p.y - TILE_H * 1.4); g.lineTo(p.x + TILE_W * 1.4, p.y); g.lineTo(p.x, p.y + TILE_H * 1.4); g.lineTo(p.x - TILE_W * 1.4, p.y); g.closePath(); g.fill();
            g.globalAlpha = a; g.strokeStyle = "#ffe733"; g.lineWidth = 2; g.setLineDash([6, 5]); g.stroke(); g.setLineDash([]);
        }
        const work = (typeof followers !== "undefined" ? followers : []).find(q => q && !q.dead && q._siteWork && q._siteWork.site === s.id && q._siteWork.workAt !== null);
        if (work) { const k = Math.min(1, (f0 - work._siteWork.workAt) / T.setup); g.globalAlpha = 1; g.strokeStyle = "#ffe733"; g.lineWidth = 4; g.beginPath(); g.arc(p.x, p.y - 30, 16, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); g.stroke(); }
        // the label: what a tap does here
        const txt = on ? "⚡ KINETIC LAUNCHER · TAP TO SEND A FOLLOWER UP" : work || _techSettingUp(s) ? "⚡ SETTING UP A KINETIC LAUNCHER" : "⚡ LAUNCHER SITE · TAP TO SET UP";
        g.globalAlpha = a; g.font = font(14); g.textAlign = "center"; g.textBaseline = "middle";
        const w = g.measureText(txt).width + 24, y = p.y - 92 + Math.sin(f0 * 0.07) * 3;
        g.fillStyle = "rgba(5,8,18,0.86)"; g.fillRect(p.x - w / 2, y - 14, w, 28); g.strokeStyle = "#ffe733"; g.lineWidth = 2; g.strokeRect(p.x - w / 2 + 1, y - 13, w - 2, 26); g.fillStyle = "#ffe733"; g.fillText(txt, p.x, y + 1);
        _techLabels[s.id] = { x: p.x - w / 2, y: y - 14, w, h: 28 };
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
    g.restore();
}
