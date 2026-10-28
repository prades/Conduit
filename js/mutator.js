// ─────────────────────────────────────────────────────────
//  THE MUTATOR'S KIT: the lash, and the one clone (docs/MUTATOR.md)
// ─────────────────────────────────────────────────────────
// ASKED (the brief): "Mutator: melee-focused summoner and biological specialist. Fights alongside a single primary cloned creature." "The Mutator normally has only one active primary clone." "If the clone
// dies, its accumulated upgrades are lost and a replacement must be created."
//   THE LASH       the Mutator's own weapon (WEAPONS.lash, js/weapons.js), put in hand when the class is chosen. It is aimed the way the gun is (js/targeting.js, js/gunfire.js: the dial at the top left, a tap on
//                  the locked creature, hold to keep going): a creature out of reach is WALKED TO, and the lash comes in two beats like a creature's bite (docs/COMBAT.md): the tentacle draws back for
//                  MUTATOR.lash.windup frames, then lands for the weapon's damage (the number over the creature). A creature that got out of reach in the wind-up is missed (MISS). It spends no ammunition. A tap on
//                  the floor, or putting the weapon away, calls the attack off.
//   THE CLONE      cloning is the Mutator's (CLASS_RULES.clone, js/classes.js): one at a time, and that one is its PRIMARY clone (c.primary). The Clone Bay makes it as it makes every clone (js/clone.js makeClone); it
//                  follows the Mutator, takes the battle tool's orders (HOLD, COME, RETREAT, the enemy card's ATTACK) and fights as the creature it is (js/clone.js cloneFight). It does NOT come back by itself:
//                  when it falls it leaves its BODY where it fell (cloneBodies, below), and a new clone has to be grown.
//   ITS UPGRADES   (the brief's step 5) DNA buys the clone UPGRADES (CLONE_UPGRADES, data: a row is a new upgrade, nothing else changes), and they are lost when it falls. What it cost is kept on it (c.invested),
//                  and a share of that can be SALVAGED from its body (MUTATOR.dna.recover): a long press on the body (the ring's SALVAGE DNA) or RELEASE at the Clone Bay.
// Every number here is a knob, not a decision (docs/MUTATOR.md, "Tentative").
const MUTATOR = {
    lash: { windup: 9, slack: 0.3, replan: 12, fx: 14 },   // the strike's wind-up (frames); how far past its reach a creature may slip in the wind-up and still be hit (tiles); how often the walk into reach is planned again (frames); how long the lash is drawn (frames)
    body: { life: 0, near: 2.4, reach: 2.2 },              // a fallen clone's body: how long it lies (frames; 0 = until it is dealt with); how near (tiles) the player must be for its plate to say more than its name; how near to work on it (salvage, preserve)
    // DNA: `recover` is the share of what a clone cost (the splices it was grown from and the DNA its upgrades took) that comes back when its body is salvaged, or it is released at the Clone Bay (`releaseRecovers`).
    // Less than all of it, so "rebuilding repeatedly from scratch should leave the player less effective than successfully maintaining and upgrading a clone" (the brief).
    dna: { recover: 0.4, releaseRecovers: true },
    // POUNCE (the jumping attack an upgrade gives): it crouches for `windup` frames (POUNCE! over it), leaps onto a creature that is further than its reach and no further than its pounce range (the upgrade's
    // `leap` stat), in `air` frames, and bites as it lands for `dmg` times its power; then it rests `cooldown` frames.
    pounce: { windup: 14, air: 22, dmg: 1.2, cooldown: 300, lift: 34 },
    // THE MUTATOR'S LEVEL (the brief: "Higher Mutator levels increase the amount of serum generated automatically"; the Mutator "has a dedicated progression system built around biological experimentation").
    // The player had no level, so EXPERIMENTS raise it: every DNA the Mutator spends on biology (growing a clone, an upgrade, crafting a serum) is a point; `thresholds` are the points for levels 1, 2, 3...
    level: { thresholds: [0, 10, 25, 45, 70, 100, 140, 190, 250, 320] },
};
let mutatorXp = 0;   // the Mutator's experiment points (saved)
function mutatorLevel() { const T = MUTATOR.level.thresholds; let L = 1; for (let i = 1; i < T.length; i++) if (mutatorXp >= T[i]) L = i + 1; return L; }
function mutatorNextAt() { const T = MUTATOR.level.thresholds, L = mutatorLevel(); return L < T.length ? T[L] : null; }
function mutatorGainXp(n) {
    if (!(n > 0) || typeof playerClassKey === "undefined" || playerClassKey !== "mutator") return 0;
    const was = mutatorLevel(); mutatorXp += n; const now = mutatorLevel();
    if (now > was && typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 150, text: "MUTATOR ▲ LEVEL " + now + " — THE LAB MAKES MORE SERUM", color: "#c06bff", life: 220, vy: -0.05, size: 16 });
    return now - was;
}

// ── THE UPGRADES (data) ──────────────────────────────────
// ASKED: "Support upgrades such as: armor plating for improved durability; serrated arms for stronger melee attacks; a longer leap or jumping attack; increased attack radius. Keep the upgrade system data-driven
// so additional modifications can be added without rewriting the clone system. The exact DNA costs and numerical effects have not yet been finalized. Make these configurable."
//   id / name / desc     what the Clone Bay shows
//   max                  how many ranks
//   cost                 DNA for each rank ([rank 1, rank 2, ...]): any splices (dnaSpend takes the largest stocks first)
//   stat                 per rank: { statName: { mul } } multiplies by (1 + mul × rank), { add } adds add × rank. The stats a clone reads: health, power (its bite, special and shot), reach (its bite's reach,
//                        tiles), leap (its pounce range, tiles: the jumping attack; a scout's escape leap goes that much further too)
// TENTATIVE: every cost and number below.
const CLONE_UPGRADES = {
    armor:    { id: "armor",    name: "ARMOR PLATING", desc: "Plates grown over its body: a quarter more health a rank.", max: 3, cost: [4, 7, 10], stat: { health: { mul: 0.25 } } },
    serrated: { id: "serrated", name: "SERRATED ARMS", desc: "Serrated forelimbs: its bite, special and shot hit a quarter harder a rank.", max: 3, cost: [4, 7, 10], stat: { power: { mul: 0.25 } } },
    leap:     { id: "leap",     name: "POUNCE",        desc: "It leaps onto a creature from further off and bites as it lands (and a scout's escape leap goes further).", max: 2, cost: [5, 8], stat: { leap: { add: 2.5 } } },
    reach:    { id: "reach",    name: "LONG REACH",    desc: "A longer strike: its bite reaches further (the attack radius).", max: 2, cost: [4, 7], stat: { reach: { add: 0.35 } } },
};
const CLONE_UPGRADE_ORDER = ["armor", "serrated", "leap", "reach"];
function cloneUpRank(c, id) { return c && c.upgrades ? Math.max(0, c.upgrades[id] | 0) : 0; }
// a stat through the clone's upgrades: the base, multiplied and added to by every rank it has
function cloneUpStat(c, name, base) {
    let v = base; const u = c && c.upgrades; if (!u) return v;
    for (const id of Object.keys(u)) { const d = CLONE_UPGRADES[id], r = Math.max(0, u[id] | 0), s = d && d.stat && d.stat[name]; if (!s || !r) continue; if (s.mul) v *= 1 + s.mul * r; if (s.add) v += s.add * r; }
    return v;
}
// what its upgrades make of it: its health and power (js/levels.js _applyPredLevel multiplies by these at every level), its reach, its pounce range and a scout's escape leap
function cloneApplyUpgrades(c) {
    if (!c || !c.isClone) return c;
    const base = typeof COMBAT !== "undefined" ? COMBAT.bite.reach : 1.5, r = cloneUpStat(c, "reach", base);
    c.biteReach = r > base + 1e-6 ? r : undefined;
    c.pounceRange = cloneUpStat(c, "leap", 0) > 0 ? cloneUpStat(c, "leap", 0) + r : 0;
    if (c.abilityKey === "LEAP" && typeof ABILITY_DEFS !== "undefined") { const add = cloneUpStat(c, "leap", 0); c.leapDistance = add > 0 ? ABILITY_DEFS.LEAP.distance + add : undefined; }
    if (typeof _applyPredLevel === "function" && c.base) _applyPredLevel(c, false);
    return c;
}
// the next rank of an upgrade: { ok, cost, rank } or { ok: false, why }
function cloneUpgradeNext(c, id) {
    const d = CLONE_UPGRADES[id]; if (!d) return { ok: false, why: "NO SUCH UPGRADE" };
    if (!c || c.dead) return { ok: false, why: "GROW A CLONE FIRST" };
    const r = cloneUpRank(c, id); if (r >= d.max) return { ok: false, why: "ALREADY AT THE TOP RANK", top: true, rank: r };
    const cost = Array.isArray(d.cost) ? d.cost[Math.min(r, d.cost.length - 1)] : d.cost;
    if (dnaTotal() < cost) return { ok: false, why: "NEEDS " + cost + " DNA (YOU HAVE " + dnaTotal() + ")", cost, rank: r };
    return { ok: true, cost, rank: r };
}
// buy the next rank for the Mutator's clone (the Clone Bay's BUY): the DNA is spent, the rank goes up, the clone is made over, and what it cost is added to what it is worth
function cloneUpgradeBuy(id, c) {
    c = c || mutatorClone(); const n = cloneUpgradeNext(c, id); if (!n.ok) { _mxSay(n.why, "#ff9c8a"); return n; }
    dnaSpend(n.cost); c.upgrades = Object.assign({}, c.upgrades || {}, { [id]: n.rank + 1 }); c.invested = (c.invested || 0) + n.cost; cloneApplyUpgrades(c); mutatorGainXp(n.cost); if (typeof tutTally === "function") tutTally("upgrade");
    _mxSay(CLONE_UPGRADES[id].name + " ▲ RANK " + (n.rank + 1) + " — " + n.cost + " DNA", CLASSES.mutator.colour);
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: c.x, y: c.y, color: "#c06bff", radius: 0.9, life: 24 });
    return { ok: true, rank: n.rank + 1, cost: n.cost };
}
function _mxSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color: col || "#c06bff", life: 110, vy: -0.22, size: 13 }); }

// ── THE CLONE BAY WITH YOUR CLONE OUT: its upgrades (js/clone.js _drawClonesTab draws this in place of the card strip) ──
// The clone at the top (its picture, kind, level, health, bite, reach, pounce), the DNA you have, RELEASE (a second tap confirms: its upgrades go with it, a share of what it cost comes back); then a row for each
// upgrade: its name, what it does, its ranks, the next rank's DNA and BUY. At the foot, what is at stake: its upgrades are lost if it falls, and what its body would give back.
let _mxUpBtns = [], _mxReleaseAt = -1e9;
function drawCloneUpgradePanel(PX, PY, PW, PH, c) {
    const f = _mxFrame(), col = CLASSES.mutator.colour, gut = 16, x0 = PX + gut, w = PW - gut * 2, btns = [];
    // the clone
    const topH = 96, artW = 100;
    uiSlab(x0, PY + 6, w, topH, col, false, "#130a22");
    if (typeof drawCloneArt === "function") { ctx.save(); ctx.beginPath(); ctx.rect(x0 + 6, PY + 10, artW, topH - 8); ctx.clip(); try { drawCloneArt(ctx, { key: c.speciesName + "_" + c.className, speciesName: c.speciesName, className: c.className, ready: true }, x0 + 6 + artW / 2, PY + 6 + topH * 0.8, 1.7); } catch (e) {} ctx.restore(); }
    const tx = x0 + artW + 16, tw = w - artW - 16 - 150;
    uiTextFit(String(c.speciesName).toUpperCase() + " " + String(c.className).toUpperCase() + " CLONE · LV " + (c.level || "?"), tx, PY + 30, 20, "#f1e2ff", "left", tw);
    const hp = Math.max(0, c.health), mx = Math.max(1, c.maxHealth), fr = hp / mx; ctx.fillStyle = "#05070f"; ctx.fillRect(tx, PY + 44, tw, 10); ctx.fillStyle = fr > 0.5 ? "#19e6c1" : fr > 0.25 ? "#ffd34d" : "#ff5a3a"; ctx.fillRect(tx, PY + 44, tw * fr, 10); ctx.strokeStyle = "#2c3656"; ctx.lineWidth = 1.2; ctx.strokeRect(tx, PY + 44, tw, 10);
    uiCaptionFit("HP " + Math.ceil(hp) + "/" + Math.round(mx) + "   BITE " + Math.round(c.power) + "   REACH " + cloneReach(c).toFixed(2) + "   POUNCE " + (c.pounceRange > 0 ? c.pounceRange.toFixed(1) + " TILES" : "—"), tx, PY + 70, "#c8b6e6", "left", 12, tw);
    uiCaptionFit("DNA " + dnaTotal() + "  (ANY SPLICES)   ·   MUTATOR LV " + mutatorLevel() + (mutatorNextAt() !== null ? " (" + mutatorXp + "/" + mutatorNextAt() + ")" : ""), tx, PY + 90, "#9dffb6", "left", 12, tw);
    const confirm = f - _mxReleaseAt < 150, rb = { x: x0 + w - 142, y: PY + 20, w: 130, h: 40 };
    uiButton(rb, confirm ? "SURE? TAP AGAIN" : "RELEASE", confirm ? UI_RED : "#6a7aa0", confirm, confirm ? 12 : 15); btns.push({ r: rb, act: "release" });
    // the upgrades
    const rows = CLONE_UPGRADE_ORDER.filter(id => CLONE_UPGRADES[id]), rowY0 = PY + topH + 16, footH = 40, rowH = Math.max(58, Math.min(84, Math.floor((PH - topH - 16 - footH) / rows.length) - 6));
    rows.forEach((id, i) => {
        const d = CLONE_UPGRADES[id], r = cloneUpRank(c, id), n = cloneUpgradeNext(c, id), y = rowY0 + i * (rowH + 6), on = r > 0;
        uiSlab(x0, y, w, rowH, on ? col : "#3a2a55", false, "#0e0a1a");
        uiTextFit(d.name, x0 + 14, y + 22, 18, on ? "#f1e2ff" : "#cbb8e8", "left", w - 220);
        const lines = uiWrap(d.desc, Math.max(24, Math.floor((w - 230) / 7))).slice(0, rowH > 66 ? 2 : 1); lines.forEach((l, k) => uiCaptionFit(l, x0 + 14, y + 40 + k * 14, "#9f8fc0", "left", 11, w - 230));
        for (let k = 0; k < d.max; k++) { ctx.fillStyle = k < r ? col : "#2a2140"; ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x0 + w - 196 + k * 16, y + rowH / 2, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
        const bb = { x: x0 + w - 136, y: y + rowH / 2 - 19, w: 124, h: 38 };
        if (n.top) uiButton(bb, "TOP RANK", "#6a7aa0", false, 13, null, true);
        else { uiButton(bb, "BUY · " + n.cost + " DNA", n.ok ? col : "#6a5a85", false, 13, null, !n.ok); btns.push({ r: bb, act: "buy", id }); }
    });
    uiCaptionFit("IF IT FALLS ITS UPGRADES ARE LOST. ITS BODY GIVES BACK " + Math.round(MUTATOR.dna.recover * 100) + "% OF WHAT IT COST: " + cloneRecoverable(c.invested) + " OF " + (c.invested || 0) + " DNA.", PX + PW / 2, PY + PH - 14, "#c8b6e6", "center", 12, PW - 30);
    _mxUpBtns = btns;
}
// a tap in the panel: true when it was one of its buttons
function cloneUpgradeTap(ex, ey) {
    for (const b of _mxUpBtns) {
        if (ex < b.r.x || ex > b.r.x + b.r.w || ey < b.r.y || ey > b.r.y + b.r.h) continue;
        if (b.act === "buy") cloneUpgradeBuy(b.id);
        else if (b.act === "release") { const f = _mxFrame(); if (f - _mxReleaseAt < 150) { _mxReleaseAt = -1e9; if (typeof dismissOldestClone === "function") dismissOldestClone(); } else _mxReleaseAt = f; }
        return true;
    }
    return false;
}

// ── DNA (the splices: js/clone.js dnaInventory, under "species_class") ──
// Growing a clone takes ITS species' splices (CLONE_COSTS); an upgrade, and the serum (the brief's step 7), take ANY: dnaSpend takes them from the largest stocks first, so the rare ones are kept for growing.
function dnaTotal() { const inv = typeof getDNA === "function" ? getDNA() : {}; let n = 0; for (const k of Object.keys(inv)) n += Math.max(0, inv[k] | 0); return n; }
function dnaSpend(n) {
    n = Math.max(0, Math.floor(n)); if (dnaTotal() < n || typeof deductDNA !== "function") return false;
    while (n > 0) { const inv = getDNA(); let best = null, bv = 0; for (const k of Object.keys(inv)) if ((inv[k] | 0) > bv) { bv = inv[k] | 0; best = k; } if (!best) return false; const t = Math.min(n, bv); deductDNA(best, t); n -= t; }
    return true;
}
// what a clone recovers when it is salvaged or released: a share of what it cost, as its own species' and class's splices
function cloneRecoverable(invested) { return Math.max(0, Math.floor((invested || 0) * MUTATOR.dna.recover)); }
function _mxRecover(sp, cls, invested, how) {
    const n = cloneRecoverable(invested); if (n > 0 && typeof addDNA === "function") addDNA(sp + "_" + (cls || "scout"), n);
    _mxSay("+" + n + " " + String(sp).toUpperCase() + " DNA " + how + " (" + Math.round(MUTATOR.dna.recover * 100) + "% OF " + (invested || 0) + ")", "#9dffb6");
    return n;
}

// ── THE LASH ─────────────────────────────────────────────
// goal: the creature the Mutator is going for (walked to, then struck); target: the one the lash in its wind-up is for; fx: the lash being drawn; face*: the player turns to what it strikes (js/hdsprites.js)
const _mx = { goal: null, target: null, windup: 0, pathAt: -1e9, fx: null, faceTo: null, faceAt: -1e9 };
function _mxFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _mxDist(a) { return Math.hypot(a.x - player.x, a.y - player.y); }
function _mxHeld() { return typeof gunHold !== "undefined" && !!gunHold && !gunHold.released; }
// THE MELEE WEAPON IN HAND (the Mutator's lash; the Technomancer's gauntlet punches the same way: js/technomancer.js): its reach, its wind-up, its colour; the lash's when the weapon in hand has no melee
function _mxWeapon() { const w = typeof weaponDef === "function" ? weaponDef() : null; return w && (w.kind === "melee" || w.kind === "hybrid") ? w : (typeof WEAPONS !== "undefined" ? WEAPONS.lash : null); }
function _mxWindup() { const w = _mxWeapon(); return w && w.windup ? w.windup : MUTATOR.lash.windup; }
function lashReach() { const w = _mxWeapon(); return typeof classStat === "function" ? classStat("lashReach", w && w.reach ? w.reach : 1.45) : (w && w.reach) || 1.45; }
function mutatorLashing() { return _mx.windup > 0; }
// the creature the lash is going for or winding up at (the dial, the tests)
function mutatorLashGoal() { return _mx.target || _mx.goal || null; }
// stop where the player stands (in reach: no further)
function _mxStop() { player.fpPath = null; player.targetX = player.x; player.targetY = player.y; }
// walk toward a spot in reach of the creature, on the side the player is on (planned again every MUTATOR.lash.replan frames while it moves). In sight, straight to that spot: a tile's centre can be just
// out of reach (the walk stopped 1.5 tiles off a creature whose lash reaches 1.45, and planned the same tile again for good); round the walls, by the route to the nearest tile.
function _mxApproach(foe) {
    const f = _mxFrame(); if (f - _mx.pathAt < MUTATOR.lash.replan && player.fpPath && player.fpPath.length) return;
    if (typeof facilityPortalBusy === "function" && facilityPortalBusy()) return;   // (nobody walks while the screen fades through a doorway)
    _mx.pathAt = f;
    const d = _mxDist(foe) || 1, k = Math.min(1, lashReach() * 0.7 / d), tx = foe.x + (player.x - foe.x) * k, ty = foe.y + (player.y - foe.y) * k;
    if (typeof facilityLosFrom !== "function" || facilityLosFrom(player.x, player.y, tx, ty)) { player.fpPath = [[tx, ty]]; player.targetX = tx; player.targetY = ty; return; }
    if (typeof facilityWalkTo === "function" && !facilityWalkTo(Math.round(tx), Math.round(ty))) facilityWalkTo(Math.round(foe.x), Math.round(foe.y));
}
// THE ATTACK (js/input.js firePlayerShot, when the weapon in hand is a melee one): true when a strike has begun. Out of reach it walks the player in and the strike comes when it is in reach (mutatorTick).
function mutatorLash(foe) {
    if (!foe || foe.dead) return false;
    _mx.goal = foe;
    if (_mx.windup > 0) return false;   // (already drawing back)
    if (_mxDist(foe) > lashReach()) { _mxApproach(foe); return false; }
    const w = _mxWeapon(); _mx.windup = _mxWindup(); _mx.windupOf = _mx.windup; _mx.target = foe; _mx.faceTo = foe; _mx.faceAt = _mxFrame();
    player.attackCooldown = _mx.windup + (typeof weaponCooldown === "function" ? weaponCooldown(w ? w.id : "lash") : 34);
    _mxStop();
    return true;
}
// the lash lands (or misses): the number, the flash on the creature, the lash drawn from the player to it
function _mxStrike(t) {
    const f = _mxFrame(), hit = !!t && !t.dead && _mxDist(t) <= lashReach() + MUTATOR.lash.slack;
    const w = _mxWeapon(); _mx.fx = { t0: f, x: t ? t.x : player.x, y: t ? t.y : player.y, hit, col: w && w.col ? w.col : "#c06bff", style: w && w.fx ? w.fx : "whip" };
    if (!t) return false;
    if (!hit) { if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: t.x, y: t.y, text: "MISS", color: "#d8c4f0", size: 12, life: 34, vy: -0.035 }); return false; }
    applyDamage(t, typeof weaponDamage === "function" ? weaponDamage(w ? w.id : "lash") : 18, { x: player.x, y: player.y, team: "green", element: w && w.element ? w.element : null, isPlayer: true }, w && w.element ? w.element : null);
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: t.x, y: t.y, color: w && w.col ? w.col : "#c06bff", radius: 0.55, life: 16 });
    if (w && typeof w.onHit === "function") w.onHit(t);   // (the gauntlet's punch charges it: js/technomancer.js)
    if (typeof tutTally === "function") tutTally(w ? w.id : "lash");   // (a strike that landed: the class's stage counts it, js/tutorial.js)
    if (typeof shake !== "undefined") shake = Math.max(shake, 2);
    return true;
}
// each step, after the gun's (js/game.js): the wind-up runs down and the lash lands; a creature that is being gone for is walked to and struck once it is in reach. A click is one strike; holding keeps striking.
function mutatorTick() {
    if (_mx.windup > 0) {
        const t = _mx.target;
        if (!t || t.dead) { _mx.windup = 0; _mx.target = null; return; }   // (it died first: nothing to land on)
        _mx.faceAt = _mxFrame();
        if (--_mx.windup <= 0) { _mx.target = null; _mxStrike(t); if (!_mxHeld()) _mx.goal = null; else _mx.heldStruck = true; }
        return;
    }
    if (_mx.heldStruck && !_mxHeld()) { _mx.heldStruck = false; _mx.goal = null; return; }   // (a hold that has struck is let go: no strike after it; a click is still one strike)
    const g = _mx.goal; if (!g) return;
    if (g.dead || (typeof playerAttackMode !== "undefined" && !playerAttackMode) || _mxDist(g) > (typeof TARGET !== "undefined" ? TARGET.manualKeep : 18) || (typeof weaponMelee === "function" && !weaponMelee())) { _mx.goal = null; return; }
    if (_mxDist(g) <= lashReach()) { _mxStop(); if ((player.attackCooldown || 0) <= 0) mutatorLash(g); }
    else _mxApproach(g);
}
// a tap on the floor (js/input.js), putting the weapon away (js/gunfire.js gunStow): the attack is off, and a lash still drawing back is let go
function mutatorCancel() { _mx.goal = null; _mx.heldStruck = false; if (_mx.windup > 0) { _mx.windup = 0; _mx.target = null; } if (typeof _bodyGoal !== "undefined") _bodyGoal = null; }   // (and a walk to a fallen clone's body: below)
// the row of the player's sheet to face while it strikes (js/hdsprites.js hdPlayerState), or null
function mutatorFacing() {
    const t = _mx.faceTo; if (!t || _mxFrame() - _mx.faceAt > 18 || typeof hdRow !== "function") return null;
    return hdRow(t.x - player.x, t.y - player.y);
}
// THE LASH, DRAWN (over the scene, js/game.js): while it draws back, a tentacle curls up behind the player, away from the creature; when it lands, a whip from the player to the creature that fades, purple on a hit,
// grey on a miss. The player's own sheet is not changed (the brief: no redesign of an established character).
function _mxScr(x, y) { return [(x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 - (typeof facilityLiftRel === "function" ? facilityLiftRel(x, y) : 0)]; }
function _mxCurve(x0, y0, cx, cy, x1, y1, t) {   // the first t of a quadratic curve, as a path
    const ax = x0 + (cx - x0) * t, ay = y0 + (cy - y0) * t, bx = cx + (x1 - cx) * t, by = cy + (y1 - cy) * t, ex = ax + (bx - ax) * t, ey = ay + (by - ay) * t;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(ax, ay, ex, ey);
}
function drawMutatorFx() {
    if (typeof ctx === "undefined" || typeof canvas === "undefined") return;
    const f = _mxFrame(), mw = _mxWeapon(), col = mw && mw.col ? mw.col : "#c06bff";
    const [px, py0] = _mxScr(player.visualX, player.visualY), py = py0 - 46;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (_mx.windup > 0 && _mx.target && !_mx.target.dead) {   // drawing back
        const k = 1 - _mx.windup / (_mx.windupOf || MUTATOR.lash.windup), [tx, ty0] = _mxScr(_mx.target.x, _mx.target.y), ang = Math.atan2(ty0 - 30 - py, tx - px) + Math.PI, r = 10 + 16 * k;
        const ex = px + Math.cos(ang) * r, ey = py + Math.sin(ang) * r * 0.8 - 10 * k;
        ctx.globalAlpha = 0.5 + 0.5 * k; ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px, py + 6); ctx.quadraticCurveTo(px + Math.cos(ang + 1.2) * r * 0.9, py + Math.sin(ang + 1.2) * r * 0.6, ex, ey); ctx.stroke();
        ctx.strokeStyle = "#f1e2ff"; ctx.lineWidth = 2; ctx.stroke();
        ctx.globalAlpha = 0.35 + 0.4 * k; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tx, ty0 - 30, 12 + 8 * (1 - k), 0, Math.PI * 2); ctx.stroke();   // and a ring closing on what it is for
    }
    const fx = _mx.fx;
    if (fx) {
        const age = f - fx.t0;
        if (age < 0 || age > MUTATOR.lash.fx) _mx.fx = null;
        else {
            const [tx, ty0] = _mxScr(fx.x, fx.y), ty = ty0 - 30, mx = (px + tx) / 2, my = (py + ty) / 2, dx = tx - px, dy = ty - py, dl = Math.hypot(dx, dy) || 1, jab = fx.style === "jab", bend = jab ? 0 : Math.min(40, dl * 0.35);
            const cx = mx - dy / dl * bend, cy = my + dx / dl * bend - (jab ? 0 : 18), ext = Math.min(1, (age + 1) / (jab ? 2 : 4)), fade = 1 - Math.max(0, age - 3) / (MUTATOR.lash.fx - 3), sc = fx.col || col;
            ctx.globalAlpha = Math.max(0, fade) * 0.55; ctx.strokeStyle = fx.hit ? sc : "#8f86a6"; ctx.lineWidth = jab ? 7 : 9; _mxCurve(px, py + 4, cx, cy, tx, ty, ext); ctx.stroke();
            ctx.globalAlpha = Math.max(0, fade); ctx.strokeStyle = fx.hit ? "#f1f8ff" : "#c9c3d8"; ctx.lineWidth = 3; ctx.stroke();
            if (fx.hit && age < 6) { ctx.globalAlpha = 1 - age / 6; ctx.fillStyle = "#f6f4ff"; ctx.beginPath(); ctx.arc(tx, ty, 6 + age * 3, 0, Math.PI * 2); ctx.fill(); }
            if (fx.hit && jab && age < 8) { ctx.globalAlpha = 1 - age / 8; ctx.strokeStyle = sc; ctx.lineWidth = 2; for (let k = 0; k < 5; k++) { const a = k * 1.26 + fx.t0, r0 = 6 + age * 2, r1 = r0 + 8; ctx.beginPath(); ctx.moveTo(tx + Math.cos(a) * r0, ty + Math.sin(a) * r0); ctx.lineTo(tx + Math.cos(a + 0.3) * (r0 + 4), ty + Math.sin(a + 0.3) * (r0 + 4)); ctx.lineTo(tx + Math.cos(a) * r1, ty + Math.sin(a) * r1); ctx.stroke(); } }   // (a punch's sparks)
        }
    }
    ctx.restore();
}

// ── THE ONE CLONE ────────────────────────────────────────
// The Mutator's clone: the live primary clone, or null
function mutatorClone() { return typeof actors !== "undefined" ? actors.find(a => a && a.isClone && a.primary && !a.dead) || null : null; }
// The Clone Bay has just grown it (js/clone.js executeClone, when the class's clones are primary)
function mutatorCloneMade(c, option) {
    if (!c) return null;
    c.primary = true;   // (the bay says so: js/clone.js executeClone, "YOUR CLONE: ANT SCOUT · IT FOLLOWS YOU")
    c.upgrades = {}; c.invested = option && option.needed ? option.needed : 0;   // a new clone has no upgrades; what it is worth starts at the splices it was grown from
    cloneApplyUpgrades(c);
    mutatorGainXp(c.invested);   // (growing it is an experiment: the Mutator's level)
    if (typeof tutTally === "function") tutTally("clone");   // (the class's stage counts it: js/tutorial.js)
    return c;
}
// RELEASE at the Clone Bay (js/clone.js dismissOldestClone): it is let go, its upgrades with it; a share of what it cost comes back (MUTATOR.dna.releaseRecovers), as when its body is salvaged
function mutatorReleased(c) {
    if (!c || !c.primary) return 0;
    return MUTATOR.dna.releaseRecovers ? _mxRecover(c.speciesName, c.className, c.invested, "RECOVERED") : 0;
}

// ── POUNCE: the jumping attack (the POUNCE upgrade: c.pounceRange) ──
// A creature further off than its reach and within its pounce range, in sight: it crouches (POUNCE! over it, its body drawn back), leaps (an arc, as a scout's escape leap is drawn), and bites as it lands. While it is told
// to RETREAT it does not pounce. Returns true while a pounce has the step (js/clone.js cloneTick).
function clonePounceTick(c) {
    const P = c.pounce, K = MUTATOR.pounce, f = _mxFrame();
    if (P) {
        const t = P.target;
        if (P.phase === "wind") {
            if (!t || t.dead) { c.pounce = null; c.attackAnim = 0; return false; }
            if (typeof faceToward === "function") faceToward(c, t.x, t.y, 0.3); c.state = "attack"; c.attackAnim = -0.55 * (1 - P.t / K.windup);
            if (--P.t <= 0) {
                const d = Math.hypot(t.x - c.x, t.y - c.y) || 1, back = Math.min(d, cloneReach(c) * 0.55);
                P.phase = "air"; P.t = 0; P.fx = c.x; P.fy = c.y; P.tx = t.x + (c.x - t.x) / d * back; P.ty = t.y + (c.y - t.y) / d * back;
            }
            return true;
        }
        P.t++; const k = Math.min(1, P.t / K.air);
        c.x = P.fx + (P.tx - P.fx) * k; c.y = P.fy + (P.ty - P.fy) * k; c.leapLift = Math.sin(k * Math.PI) * K.lift; c.walkCycle = (c.walkCycle || 0) + 0.25;
        if (k >= 1) {
            c.leapLift = 0; c.pounce = null; c.pounceReady = f + K.cooldown; c.attackAnim = 0.01; c.state = "attack";
            if (t && !t.dead && Math.hypot(t.x - c.x, t.y - c.y) <= cloneReach(c) + 0.6) { applyDamage(t, c.power * K.dmg, c); if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: t.x, y: t.y, color: c.color || "#c06bff", radius: 0.8, life: 20 }); }
        }
        return true;
    }
    if (!(c.pounceRange > 0) || (c.pounceReady || 0) > f || c.retreatUntil > f || c.attackWindup > 0 || c.abilityPhase === "winding" || c.abilityPhase === "active") return false;
    const foe = c._nearestEnemy; if (!foe || foe.dead || foe.untargetable) return false;
    const d = Math.hypot(foe.x - c.x, foe.y - c.y);
    if (d <= cloneReach(c) + 0.6 || d > c.pounceRange || (typeof facilityLosFrom === "function" && !facilityLosFrom(c.x, c.y, foe.x, foe.y))) return false;
    c.pounce = { phase: "wind", t: K.windup, target: foe };
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: c.x, y: c.y, text: "POUNCE!", color: "#c06bff", life: 40, vy: -0.05, size: 12 });
    return true;
}
// ── ITS BODY ──
// A primary clone that falls (the death sweep, js/game.js) does not come back: its body lies where it fell, with what it was (its kind, level and XP), until it is dealt with (the next steps of docs/MUTATOR.md:
// what can be recovered from it, and the Ice Mage's preservation) or MUTATOR.body.life runs out. A clone that was DISMISSED leaves none.
let cloneBodies = [];
let _bodyN = 0;
// The body keeps what the clone was (its kind, level, the upgrades it had, what it cost): the upgrades are LOST to the Mutator (a new clone starts without them); what it cost is what SALVAGE recovers a share of.
function cloneFallen(c) {
    if (!c) return null;
    const f = _mxFrame(), up = Object.assign({}, c.upgrades || {}), ranks = Object.values(up).reduce((s, r) => s + (r | 0), 0);
    const b = { id: ++_bodyN, sp: c.speciesName, cls: c.className || "scout", level: c.level, xp: c.xp, x: c.x, y: c.y, dirX: c.dirX || 1, dirY: c.dirY || 0, t0: f, upgrades: up, invested: c.invested || 0 };
    cloneBodies.push(b);
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") {
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 130, text: "YOUR " + String(b.sp).toUpperCase() + " " + String(b.cls).toUpperCase() + " CLONE HAS FALLEN" + (ranks ? " — ITS " + ranks + " UPGRADE" + (ranks > 1 ? "S ARE" : " IS") + " LOST" : ""), color: CLASSES.mutator.colour, life: 240, vy: -0.05, size: 16 });
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 104, text: "HOLD ON ITS BODY TO SALVAGE " + cloneRecoverable(b.invested) + " DNA — GROW A NEW ONE AT THE CLONE BAY", color: "#c8b6e6", life: 240, vy: -0.05, size: 12 });
    }
    return b;
}
// SALVAGE DNA (the long press on a body: js/commands.js): the player must be near it (MUTATOR.body.reach): from further off they walk to it and it is done when they arrive. A share of what the clone cost
// (MUTATOR.dna.recover) comes back as its species' DNA, and the body is gone. Returns how much came back (null while walking to it).
let _bodyGoal = null;   // { id, act }: a body being walked to, and what to do there
function cloneBodyNear(b) { return !!b && Math.hypot(b.x - player.x, b.y - player.y) <= MUTATOR.body.reach; }
function cloneBodyWalk(b, act) {
    mutatorCancel();   // (the lash is let go; and the walk to the body is what the player now wants)
    _bodyGoal = { id: b.id, act };
    if (typeof facilityWalkTo === "function" && !facilityWalkTo(Math.round(b.x), Math.round(b.y))) { const c = typeof _fpNearestCell === "function" ? _fpNearestCell(b.x, b.y) : null; if (c) facilityWalkTo(c[0], c[1]); }
    return null;
}
function cloneSalvage(b) {
    if (!b || !cloneBodies.includes(b)) return 0;
    if (b.kind === "follower" || b.frozen) { _mxSay(b.frozen ? "IT IS PRESERVED IN ITS CAPSULE: NOTHING TO SALVAGE" : "ONLY A CLONE'S BODY GIVES DNA", "#ff9c8a"); return 0; }   // (a follower's body is the Ice Mage's to preserve: js/specimen.js)
    if (!cloneBodyNear(b)) return cloneBodyWalk(b, "salvage");
    _bodyGoal = null; cloneBodies = cloneBodies.filter(x => x !== b);
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: b.x, y: b.y, color: "#9dffb6", radius: 0.9, life: 26 });
    return _mxRecover(b.sp, b.cls, b.invested, "SALVAGED");
}
// each step: a body whose time is up goes (with life 0 it stays); a body the player was walking to is worked on when they get there (the walk is let go if they are sent somewhere else)
function mutatorBodiesTick() {
    if (_bodyGoal) {
        const b = cloneBodies.find(x => x.id === _bodyGoal.id);
        if (!b) _bodyGoal = null;
        else if (cloneBodyNear(b)) { const act = _bodyGoal.act; _bodyGoal = null; if (act === "salvage") cloneSalvage(b); else if (typeof cloneBodyAct === "function") cloneBodyAct(b, act); }
        else if (!player.fpPath || !player.fpPath.length) _bodyGoal = null;
    }
    const L = MUTATOR.body.life; if (!(L > 0) || !cloneBodies.length) return;
    const f = _mxFrame(); cloneBodies = cloneBodies.filter(b => f - b.t0 < L);
}
// THE BODY'S RING (js/draw.js drawRadialMenu, js/input.js, js/commands.js): UP is SALVAGE DNA; RIGHT is a second order when there is one ({ label, act }, act ending in "_body": cloneBodyAct does it)
function mutatorBodyRing(b) {
    const n = cloneRecoverable(b && b.invested), ring = { up: { label: "SALVAGE DNA +" + n }, right: null, caption: String(b.sp).toUpperCase() + " " + String(b.cls).toUpperCase() + " CLONE · FALLEN · LV " + (b.level || "?") };   // (up or right may be null: no button there)
    if (typeof cloneBodyRingMore === "function") cloneBodyRingMore(b, ring);   // (the next orders on a body are added there: the brief's step 6)
    return ring;
}
// the body under a point on the screen (the long press, js/input.js), and how far from it the point is
function _bodyPickPoint(b) { const [x, y] = _mxScr(b.x, b.y); return { x, y: y - 16 }; }
function cloneBodyAtScreen(ex, ey) {
    let best = null, bd = typeof PICK_RADIUS === "number" ? PICK_RADIUS : 45;
    for (const b of cloneBodies) { const p = _bodyPickPoint(b), d = Math.hypot(ex - p.x, ey - p.y); if (d < bd) { bd = d; best = b; } }
    return best ? { body: best, d: bd } : null;
}
// ── drawing a body: the creature's own drawing (js/bugs3d.js, the Clone Bay's picture: drawCloneArt), dimmed and still, on a ring of the Mutator's colour, with its name ──
function cloneBodiesDrawItems(drawList) {
    if (!cloneBodies.length || typeof visibleForDraw !== "function") return;
    for (const b of cloneBodies) if (visibleForDraw(b.x, b.y)) drawList.push({ type: "body", x: b.x, y: b.y, body: b });
}
function drawCloneBody(b, px, py) {
    if (!b || typeof ctx === "undefined" || b.grab) return;   // (a capsule flying to the player on a flux technician's Telegrab is drawn in the air: js/techabilities.js)
    const f = _mxFrame(), col = typeof CLASSES !== "undefined" && CLASSES.mutator ? CLASSES.mutator.colour : "#c06bff", pul = 0.55 + 0.45 * Math.sin(f * 0.06 + b.id);
    ctx.save();
    ctx.translate(px, py + TILE_H); ctx.scale(1, TILE_H / TILE_W);   // the ring on the floor
    ctx.globalAlpha = 0.18 + 0.12 * pul; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.55 + 0.35 * pul; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([9, 6]); ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    // the creature: a clone's species drawn as the Clone Bay draws it; a follower drawn from what it was (js/specimen.js: a follower that fell for good)
    const a = b.kind === "follower" ? (b.actor || (b._stand = b._stand || (typeof followerBuild === "function" ? followerBuild(b.rec || {}) : null))) : typeof _cloneCardActor === "function" ? _cloneCardActor({ key: "body_" + b.sp + "_" + b.cls, speciesName: b.sp, className: b.cls }) : null;
    if (a && typeof drawNPC === "function") {
        a.dirX = b.dirX; a.dirY = b.dirY; a.walkCycle = 0; a.state = "idle"; a.attackAnim = 0; if (b.kind === "follower") { a.hitFlash = 0; a.convertFlash = 0; }   // (still: it is not walking)
        const keep = [_drawPredatorBars, drawHealthBar, typeof drawUnitTag === "function" ? drawUnitTag : null];
        _drawPredatorBars = () => {}; drawHealthBar = () => {}; if (keep[2]) drawUnitTag = () => {};   // (no bar or plate over a body: drawCloneArt does the same for the Clone Bay's pictures)
        ctx.save(); ctx.globalAlpha = b.frozen ? 0.75 : 0.5;
        try { drawNPC(a, px, py, ctx); } catch (e) { /* a picture must never take the frame down */ }
        finally { ctx.restore(); _drawPredatorBars = keep[0]; drawHealthBar = keep[1]; if (keep[2]) drawUnitTag = keep[2]; }
    }
    if (b.frozen && typeof drawSpecimenCapsule === "function") drawSpecimenCapsule(b, px, py);   // preserved: in its containment capsule (js/specimen.js)
    const near = typeof player !== "undefined" && Math.hypot(b.x - player.x, b.y - player.y) <= MUTATOR.body.near, who = typeof specimenName === "function" ? specimenName(b) : String(b.sp).toUpperCase() + " " + String(b.cls).toUpperCase() + " CLONE";
    ctx.save(); ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const name = b.frozen ? "SPECIMEN CAPSULE · " + who : who + (b.kind === "follower" ? " · FALLEN FOR GOOD" : " · FALLEN"), w = ctx.measureText(name).width + 14, y = py - (b.frozen ? 74 : 54), edge = b.frozen || b.kind === "follower" ? "#aeeaff" : col;
    ctx.globalAlpha = 0.9; ctx.fillStyle = "rgba(10,6,20,0.82)"; ctx.fillRect(px - w / 2, y - 9, w, 18); ctx.strokeStyle = edge; ctx.lineWidth = 1.2; ctx.strokeRect(px - w / 2 + 0.5, y - 8.5, w - 1, 17);
    ctx.fillStyle = "#ead9ff"; ctx.fillText(name, px, y + 0.5);
    if (near) {
        const hint = b.frozen ? "WALK OVER IT TO TAKE IT" : b.kind === "follower" ? "HOLD ON IT: PRESERVE (AN ICE MAGE)" : "HOLD ON IT: SALVAGE " + cloneRecoverable(b.invested) + " DNA, OR PRESERVE";
        ctx.font = "10px monospace"; ctx.fillStyle = "#c8b6e6"; ctx.fillText("LV " + (b.level || "?") + " · " + hint, px, y + 17);
    }
    ctx.restore();
}
// ── saving (js/facilitysave.js) ──
// (a follower's body keeps its record, `rec`; a preserved one is `frozen`: a capsule on the floor, js/specimen.js)
function cloneBodiesSnapshot() { return cloneBodies.map(b => Object.assign({ k: b.kind === "follower" ? "f" : undefined, rec: b.kind === "follower" ? b.rec : undefined, fz: b.frozen ? 1 : undefined, sp: b.sp, cls: b.cls, level: b.level, xp: b.xp, x: Math.round(b.x * 100) / 100, y: Math.round(b.y * 100) / 100, dx: Math.round((b.dirX || 1) * 100) / 100, dy: Math.round((b.dirY || 0) * 100) / 100 }, b.kind === "follower" ? {} : { up: b.upgrades || {}, inv: b.invested || 0 })); }
function cloneBodiesApply(list) {
    cloneBodies = []; if (!Array.isArray(list)) return 0;
    for (const s of list) {
        if (!s || !Number.isFinite(s.x) || !Number.isFinite(s.y)) continue;
        const common = { id: ++_bodyN, level: s.level, x: s.x, y: s.y, dirX: Number.isFinite(s.dx) ? s.dx : 1, dirY: Number.isFinite(s.dy) ? s.dy : 0, t0: _mxFrame(), frozen: !!s.fz };
        if (s.k === "f") { if (s.rec && typeof s.rec === "object") cloneBodies.push(Object.assign(common, { kind: "follower", rec: s.rec })); continue; }
        if (typeof SPECIES === "undefined" || !SPECIES[s.sp]) continue;
        cloneBodies.push(Object.assign(common, { sp: s.sp, cls: s.cls || "scout", xp: s.xp, upgrades: _mxUpClean(s.up), invested: Math.max(0, s.inv | 0) }));
    }
    return cloneBodies.length;
}
// a saved record of upgrades, kept to the ones the table has and their ranks
function _mxUpClean(up) { const o = {}; if (up && typeof up === "object") for (const id of Object.keys(up)) if (CLONE_UPGRADES[id]) { const r = Math.max(0, Math.min(CLONE_UPGRADES[id].max, up[id] | 0)); if (r) o[id] = r; } return o; }
// a clone back from the save (js/facilitysave.js cloneRosterApply): its upgrades and what it cost
function mutatorCloneRestore(c, rec) {
    if (!c || !rec) return c;
    if (rec.pr) c.primary = true;
    c.upgrades = _mxUpClean(rec.up); c.invested = Math.max(0, rec.inv | 0);
    cloneApplyUpgrades(c); c.health = c.maxHealth;
    return c;
}
// THE CLONE WAITS FOR THE MUTATOR (switching class: js/classes.js; asked, it waits for you). When you stop being the Mutator its clone is taken out of the fight with its record (its kind, level, upgrades,
// what it cost, how hurt it is): no body is left, nothing is recovered. The next time you are the Mutator it is put back beside you as it was (not healed: switching is not a way to mend it).
function mutatorCloneStash() {
    const c = mutatorClone(); if (!c || !c.speciesName) return null;
    const rec = { sp: c.speciesName, cls: c.className || "scout", level: c.level, xp: c.xp, pr: 1, up: c.upgrades || {}, inv: c.invested || 0, hp: c.maxHealth > 0 ? Math.max(0.05, Math.min(1, c.health / c.maxHealth)) : 1 };
    c.dead = true; c.dismissed = true;   // (gone without a body or a return: js/game.js passes over a dismissed clone)
    return rec;
}
function mutatorCloneReturn(rec) {
    if (!rec || !rec.sp || typeof makeClone !== "function") return null;
    let x = player.x, y = player.y;
    for (const [dx, dy] of [[0.9, 0.5], [-0.9, 0.5], [0.5, -0.9], [0, 1]]) if (typeof facilityStandOk !== "function" || facilityStandOk(player.x + dx, player.y + dy)) { x = player.x + dx; y = player.y + dy; break; }
    const k = makeClone(rec.sp, rec.cls, x, y, "wander", { level: rec.level, xp: rec.xp }); if (!k) return null;
    mutatorCloneRestore(k, rec); if (Number.isFinite(rec.hp)) k.health = Math.max(1, Math.round(k.maxHealth * Math.max(0.05, Math.min(1, rec.hp))));
    return k;
}
// a fresh game (js/facilityplay.js facilityResetState)
function mutatorReset() { _mx.goal = null; _mx.heldStruck = false; _mx.target = null; _mx.windup = 0; _mx.fx = null; _mx.faceTo = null; _mx.pathAt = -1e9; cloneBodies = []; _bodyGoal = null; mutatorXp = 0; }
