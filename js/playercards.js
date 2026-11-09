// ─────────────────────────────────────────────────────────
//  THE PLAYER CARDS' KITS: what a role does while it is awake (docs/UNIVERSAL-AND-PLAYER-CARDS.md section 2, "The 18 kits"; approved by the owner 2026-11-02, "Approve as drafted")
// ─────────────────────────────────────────────────────────
// A Player card (js/cards.js EQUIP_PLAYER_CARDS: its numbers and its words) is a ROLE for one of the player's classes. It is AWAKE while it is in one of the player's two slots and the player is its class (js/cards.js
// equipPlayerRole); after a switch of class it sleeps in its slot and does nothing here. The rules for all eighteen (approved 2026-11-02):
//   1. A ROLE WORKS ON ITS CLASS'S OWN ATTACKS: the Gunslinger's rounds, from any gun (the service gun, the machine gun, the laser rifle); the Technomancer's punch and arc; the Mutator's lash, clone and serum.
//   2. THE HIT'S ELEMENT (docs/COMBAT.md §7.9; the owner: "The role's element"): those hits take the role's element, for the element triangle only. No SP.ATK and no elemental share are added: they stay physical,
//      as they were (a gun's round is Projectile: js/damage.js DMG_HIT_GUN, whose triangle falls on the whole hit).
//   3. A STATUS a kit sets lands on EVERY hit, with Pack 1's Precision numbers (js/cards.js equipElementStatus): a status refreshes and never stacks, so every hit keeps it up without adding more.
// BUILT (the following update's Part 1a, build 2026-11-02h): the rules and THE GUNSLINGER'S SIX, on every round that hits (js/input.js firePlayerShot: the round, as it lands; js/weapons.js fireLaserShot: the beam, on the
// creature aimed at and on each it goes through). THE TECHNOMANCER'S SIX: Part 1b, build 2026-11-02i (below). THE MUTATOR'S SIX: Part 1c, build 2026-11-02j (at the end).
//   INCENDIARY GUNNER  fire rounds that BURN                BLIGHT SHOOTER   toxic rounds that WEAKEN (the game's POISON)        BREACH GUNNER  core rounds that KNOCK BACK
//   ARC SLINGER        electric rounds: each shot jumps on to the nearest other creature within kit.jump.radius tiles of the first, for kit.jump.share of its damage (the Technomancer arc's jump); one jump a shot,
//                      never to a creature the shot already hit (the laser's beam goes through some), and the jump sets nothing off
//   CRYO MARKSMAN      ice rounds that SLOW; a round that hits a creature ALREADY slowed (before this round: by anything) FREEZES it, a stun of kit.freeze.frames as the Frost Maw's bite, and that creature is not frozen
//                      again for kit.freeze.again frames; and the guns fire kit.slower slower (js/weapons.js weaponCooldown)
//   RIFT RUNNER        flux rounds that PULL the creature hit toward you: the knockback reversed (kit.pull); a beetle or a boss is never pulled (js/helpers.js vortexPullImmune), as by every pull
function _pcFrame() { return typeof frame !== "undefined" ? frame : 0; }
// the role awake now (its card), or null
function playerRole() { return typeof equipPlayerRole === "function" ? equipPlayerRole() : null; }
// the Gunslinger's role, when it is the role awake: what a gun's round is (rule 1); null otherwise
function playerGunRole() { const r = playerRole(); return r && r.match === "gunslinger" && r.kit ? r : null; }
// the share of the guns' rate of fire a role takes off (CRYO MARKSMAN), for the weapon `id` (the one in hand when none is named): 0 for none, and for a weapon that is not a gun
function playerGunSlower(id) {
    const r = playerGunRole(); if (!r || !(r.kit.slower > 0)) return 0;
    const w = typeof weaponDef === "function" ? weaponDef(id) : null;
    return w && (w.kind === "ammo" || w.kind === "fuel") ? Math.min(0.9, r.kit.slower) : 0;
}
// A ROUND OF THE GUNSLINGER'S HAS HIT `t` (after its damage): `role` is the role awake when it was fired, `src` the round's source (where it was fired from; its element is the role's). The freeze is asked first, so a
// creature is frozen by a round only when it was slowed before that round; then the status; then the pull. (A creature the round killed takes none of them.)
function playerRoundHit(role, t, src) {
    const k = role && role.kit; if (!k || !t || t.dead) return false;
    if (k.freeze && t.slowed > 0 && _pcFrame() >= (t._pcFreezeNext || 0) && typeof applyStun === "function") {
        applyStun(t, k.freeze.frames); t._pcFreezeNext = _pcFrame() + k.freeze.again;
        if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: t.x, y: t.y, text: "FROZEN", color: "#bdf0ff", size: 11, life: 46, vy: -0.03 });
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: t.x, y: t.y, color: "#cff4ff", radius: 0.6, life: 20 });
    }
    if (k.status && typeof equipElementStatus === "function") equipElementStatus(src, t, k.el);
    if (k.pull > 0 && typeof applyKnockback === "function" && typeof player !== "undefined" && player && !(typeof vortexPullImmune === "function" && vortexPullImmune(t)))
        applyKnockback(t, { x: 2 * t.x - player.x, y: 2 * t.y - player.y }, k.pull);   // (a push away from the point beyond it: toward you)
    if (k.seedfall && typeof elementEffects !== "undefined" && src !== _pc.seedSrc) {   // SEED GUNNER (BLOOM, build 2026-11-09a): every `every`th SHOT that hits plants a small SEEDFALL where it first hit
        _pc.seedSrc = src; _pc.seedHits = (_pc.seedHits || 0) + 1;   // (a shot counts once, however many it hits: the laser's beam through a line of them shares one source)
        if (_pc.seedHits % k.seedfall.every === 0) {
            const S = k.seedfall, dmg = typeof weaponDamage === "function" ? weaponDamage() : 10, e = { type: "seedfall", x: t.x, y: t.y, radius: S.radius, life: S.frames, maxLife: S.frames, by: src, bite: dmg * S.bite, element: "blossom" };
            elementEffects.push(e); if (typeof seedfallBeat === "function") seedfallBeat(e);   // (the first seeds land as it opens, as THORNWHIP's)
            if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: t.x, y: t.y, text: "SEEDFALL", color: "#ff9ccc", size: 10, life: 44, vy: -0.04 });
        }
    }
    return true;
}
// ARC SLINGER: the shot that hit `from` jumps on to the nearest other creature within the kit's reach of it, for its share of `dmg` (the shot's damage), the round's own kind of hit (Projectile, the role's element). `skip`:
// the creatures the shot already hit. The creature it jumped to, or null.
function playerRoundJump(role, from, src, dmg, skip) {
    const j = role && role.kit && role.kit.jump; if (!j || !from || !(dmg > 0) || typeof actors === "undefined") return null;
    let best = null, bd = j.radius;
    for (const a of actors) {
        if (!a || a === from || a.dead || (skip && skip.indexOf(a) >= 0) || (typeof isHostileTarget === "function" && !isHostileTarget(a))) continue;
        const d = Math.hypot(a.x - from.x, a.y - from.y);
        if (d <= bd && (typeof facilitySeesFrom !== "function" || facilitySeesFrom(from.x, from.y, a.x, a.y))) { bd = d; best = a; }   // (only to one seen from there: "Both need sight")
    }
    if (!best) return null;
    if (typeof applyDamage === "function") applyDamage(best, dmg * j.share, src, null, false, false, typeof DMG_HIT_GUN !== "undefined" ? DMG_HIT_GUN : null);
    if (typeof technoBolt === "function") technoBolt(from, best);   // (the arc's look: js/technomancer.js)
    return best;
}

// ── THE TECHNOMANCER'S SIX (the following update's Part 1b, build 2026-11-02i) ──
//   (rule 2)           its PUNCH (js/mutator.js _mxStrike, the gauntlet) and its ARC (js/technomancer.js _tcZap) take the role's element, for the triangle only (playerHitElement; the arc's hit: js/damage.js dmgArcHit)
//   FORGEMASTER        fire: the facility's three sentries' rounds BURN (js/stations.js, playerSentryHit); your repairs take kit.repair of the time, a sentry's (playerRepairShare; a relay's too until build 2026-11-07qq, when relay repairs went)
//   SMOG ENGINEER      toxic: every ONLINE relay WEAKENS every creature within kit.relays.radius tiles of it, on every card tick while it stays (js/cards.js equipTick → playerRolesTick)
//   CRYO TECH          ice: the same, and it SLOWS
//   ARC WARDEN         electric: while your lamp is OVERCHARGED (a POWER CELL), every kit.lamp.every frames every creature in its light (js/facilitytutorial.js facilityLampReach), in sight, takes the arc's zap
//                      (js/technomancer.js _tcZap: its damage, technoArcDamage, more with relays online) and GLITCHES; drawn as the arc's bolt from your hand. Light or dark.
//   GRAVITY ENGINEER   flux: SWAP on a squad member's card (js/squadfly.js) trades places with it, once in kit.swap.every frames, on the same stretch of floor (not across a doorway into another part of the map)
//   BULWARK ENGINEER   core: a POWER CELL also raises a PHOTONIC SHIELD in front of you (js/inventory.js → playerCellShield → js/techabilities.js techShieldRaise): toward the creature you have locked, if you can see
//                      it, else the way you face; kit.shield.frames long
// The swap's wait and ARC WARDEN's beat are not saved: a load starts them over.
const _pc = { wardenAt: null, swapAt: 0 };
function _pcSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 60, text, color: col || "#fff", life: 90, vy: -0.25, size: 13 }); }
// the Technomancer's role, when it is the role awake; null otherwise
function playerTechRole() { const r = playerRole(); return r && r.match === "technomancer" && r.kit ? r : null; }
// THE ELEMENT OF ONE OF THE CLASS'S OWN HITS (rule 2): "gun" (the Gunslinger's), "punch" and "arc" (the Technomancer's), "lash" (the Mutator's) take the role's element while a role of that class is awake;
// `base` otherwise (the selector's for a gun, electric for the gauntlet, none for the lash). The clone's bites: playerCloneElement (below), for SPLICER's sake.
const _PC_HIT_CLASS = { gun: "gunslinger", punch: "technomancer", arc: "technomancer", lash: "mutator" };
function playerHitElement(kind, base) { const r = playerRole(); return r && r.kit && r.kit.el && r.match === _PC_HIT_CLASS[kind] ? r.kit.el : base; }
// FORGEMASTER: what a sentry's round does when it lands (js/stations.js), or null
function playerSentryHit(src) { const r = playerTechRole(); return r && r.kit.sentries ? (t => { if (t && !t.dead && typeof equipElementStatus === "function") equipElementStatus(src, t, r.kit.el); }) : null; }
// FORGEMASTER: the share of the time your repairs take (1 with no such role)
function playerRepairShare() { const r = playerTechRole(); return r && r.kit.repair > 0 && r.kit.repair < 1 ? r.kit.repair : 1; }
// ON THE CARD TICK (js/cards.js equipTick, every EQUIP.every frames): the relays' areas and ARC WARDEN's beat
function playerRolesTick() {
    const r = playerTechRole();
    if (r && r.kit.relays) _pcRelays(r);
    if (r && r.kit.grove) _pcGrove(r);
    if (r && r.kit.lamp) _pcWarden(r); else _pc.wardenAt = null;
    _pcCloneTick();   // CORE SHAPER's clone (below): its health and its pace follow the role, worn or not
}
function _pcFoes() { return (typeof actors !== "undefined" ? actors : []).filter(a => a && !a.dead && a.health > 0 && (typeof isHostileTarget !== "function" || isHostileTarget(a))); }
function _pcRelays(r) {
    const k = r.kit.relays; if (typeof _fp === "undefined" || !_fp || !_fp.F || typeof equipElementStatus !== "function" || typeof facilityRelayAt !== "function") return 0;
    let n = 0; const foes = _pcFoes();
    for (const R of (_fp.F.relays || [])) {   // (each relay's NODE on its wall, since build 2026-11-07qq: js/stations.js facilityRelayAt)
        if (!(typeof relayOnline === "function" && relayOnline(R.id))) continue;
        const s = facilityRelayAt(R.id); if (!s) continue;
        for (const a of foes) if (Math.hypot(a.x - s.x, a.y - s.y) <= k.radius) { equipElementStatus(s, a, r.kit.el); n++; }
    }
    return n;
}
// GROVE ENGINEER (BLOOM, build 2026-11-09a): every `every` frames, every ONLINE relay mends your followers within `radius` tiles of its node, `share` of their maximum health. How many it mended.
function _pcGrove(r) {
    const k = r.kit.grove, f0 = _pcFrame(); if (f0 < (_pc.groveAt || 0)) return 0; _pc.groveAt = f0 + k.every;
    if (typeof _fp === "undefined" || !_fp || !_fp.F || typeof facilityRelayAt !== "function" || typeof healUnit !== "function" || typeof followers === "undefined") return 0;
    let n = 0;
    for (const R of (_fp.F.relays || [])) {
        if (!(typeof relayOnline === "function" && relayOnline(R.id))) continue;
        const s = facilityRelayAt(R.id); if (!s) continue;
        for (const a of followers) if (a && !a.dead && a.team === "green" && a.maxHealth > 0 && a.health < a.maxHealth && Math.hypot(a.x - s.x, a.y - s.y) <= k.radius) { healUnit(a, a.maxHealth * k.share, null); n++; }
    }
    return n;
}
function _pcWarden(r) {
    const k = r.kit.lamp, now = _pcFrame(), T = typeof _fp !== "undefined" && _fp && _fp.tut;
    if (!T || !(T.boostUntil > now) || typeof player === "undefined" || !player) { _pc.wardenAt = null; return 0; }   // (not overcharged: the beat starts again with the next cell)
    if (_pc.wardenAt !== null && now < _pc.wardenAt) return 0;
    _pc.wardenAt = now + k.every;
    const R = typeof facilityLampReach === "function" ? facilityLampReach() : 7, dmg = typeof technoArcDamage === "function" ? technoArcDamage() : 18;
    let n = 0;
    for (const a of _pcFoes()) {
        if (Math.hypot(a.x - player.x, a.y - player.y) > R || (typeof facilitySeesFrom === "function" && !facilitySeesFrom(player.x, player.y, a.x, a.y))) continue;
        if (typeof _tcZap === "function") _tcZap(a, dmg);
        if (typeof equipElementStatus === "function") equipElementStatus(player, a, r.kit.el);
        if (typeof technoBolt === "function") technoBolt(player, a, true);
        n++;
    }
    return n;
}
// GRAVITY ENGINEER: the swap's state for the squad member's card (null with no such role): { ready, left (frames) }
function playerSwapState() { const r = playerTechRole(); if (!r || !r.kit.swap) return null; const left = Math.max(0, _pc.swapAt - _pcFrame()); return { ready: left <= 0, left }; }
function _pcComp(x, y) { if (typeof _fpComps !== "function") return null; const c = typeof _fpNearestCellOpen === "function" ? _fpNearestCellOpen(x, y) : typeof _fpNearestCell === "function" ? _fpNearestCell(x, y) : null; return c ? _fpComps().get(c[0] + "," + c[1]) : null; }
// why a swap with `f` cannot be made now, or null
function playerSwapWhyNot(f) {
    const r = playerTechRole(); if (!r || !r.kit.swap) return "NO GRAVITY ENGINEER WORN";
    if (!f || f.dead || f.team !== "green" || !(typeof partySquadHas === "function" ? partySquadHas(f) : f.isFollower)) return "SQUAD MEMBERS ONLY";
    const left = _pc.swapAt - _pcFrame(); if (left > 0) return "SWAP READY IN " + Math.ceil(left / 60) + " S";
    if (typeof facilityPortalBusy === "function" && facilityPortalBusy()) return "NOT THROUGH A DOORWAY";
    if (_pcComp(player.x, player.y) !== _pcComp(f.x, f.y)) return "NOT ON YOUR STRETCH OF FLOOR";   // (across a doorway into another part of the map: a swap would skip the doorway)
    return null;
}
// trade places with a squad member: you go where it stood, it goes where you stood; once in kit.swap.every frames
function playerSwap(f) {
    const why = playerSwapWhyNot(f); if (why) return { ok: false, why };
    const r = playerTechRole(), px = player.x, py = player.y, fx = f.x, fy = f.y;
    if (typeof mutatorCancel === "function") mutatorCancel();   // (a strike being walked to is let go)
    player.x = player.targetX = player.visualX = fx; player.y = player.targetY = player.visualY = fy; player.fpPath = null;
    if (typeof _fp !== "undefined" && _fp) _fp.stationGoal = null;
    f.x = px; f.y = py; f._fpPath = null; f._fpGoalAt = null; f._fpStuck = 0; f._fpPortalGoal = null;
    _pc.swapAt = _pcFrame() + r.kit.swap.every;
    if (typeof elementEffects !== "undefined") for (const [x, y] of [[px, py], [fx, fy]]) elementEffects.push({ type: "ring", x, y, radius: 0.9, color: "#9933ff", life: 24 });
    _pcSay("SWAPPED", "#c38cff");
    return { ok: true, msg: "SWAPPED" };
}
// BULWARK ENGINEER: after a POWER CELL overcharges the lamp (js/inventory.js), a Photonic Shield in front of you: toward the creature locked, if you can see it, else the way you face. null with no such role
function playerCellShield() {
    const r = playerTechRole(); if (!r || !r.kit.shield || typeof techShieldRaise !== "function" || typeof player === "undefined" || !player) return null;
    const foe = typeof targetCurrent === "function" ? targetCurrent() : null, row = Number.isFinite(player._hdRow) ? player._hdRow : 1, a = row * Math.PI / 4;   // (the facing: js/hdsprites.js hdRow, eight ways)
    const res = techShieldRaise(player, player.x + Math.cos(a) * 5, player.y + Math.sin(a) * 5, r.kit.shield.frames, foe);
    if (!res.ok) _pcSay(res.why, "#ff9c8a");
    return res;
}

// ── THE MUTATOR'S SIX (the following update's Part 1c, build 2026-11-02j) ──
//   (rule 2)           its LASH (js/mutator.js _mxStrike, playerHitElement) and its CLONE'S BITES take the role's element, for the triangle only: they stay Slashing and Piercing, all physical (js/damage.js dmgBiteHit →
//                      playerCloneElement → dmgCloneHit). The clone's bites are its bite (js/predator.js bite) and its POUNCE's bite as it lands (js/mutator.js clonePounceTick). Its special and a striker's shot are
//                      not bites: they keep no element and set nothing.
//   ASH SURGEON        fire: on every heal beat of the serum's pool (js/serum.js serumTick → playerSerumBeat), every creature in the pool BURNS
//   PLAGUE DOCTOR      toxic: the clone's bites WEAKEN (the game's POISON; playerCloneBit), and so does the pool, on its beats
//   SPARK GENETICIST   electric: the clone's bites GLITCH
//   CRYO GENETICIST    ice: a fallen follower comes back at no cost to the Crystal (js/game.js's respawn queue → playerReviveFree); your clone, when it falls, is preserved at once with no Ice Mage, its upgrades
//                      kept (js/mutator.js cloneFallen → playerClonePreserved: its body is a specimen capsule to take to the Crystal, js/specimen.js)
//   SPLICER            flux: the clone's bites take the element of the last creature it killed (js/game.js's kill sweep → playerCloneKill), with that element's status, until its next kill; a creature with no element
//                      leaves it as it was. This replaces rule 2 for the clone (the lash is flux). The element is the clone's (c._pcSplice), not saved: a load, or a clone that waited out a switch of class, starts
//                      with none.
//   CORE SHAPER        core: the clone's bites KNOCK BACK; the clone has kit.tank.health more health, added as two ranks of ARMOR PLATING add (js/levels.js _applyPredLevel → playerCloneHealth), and moves
//                      kit.tank.slower slower (its paceMult: js/abilities.js tickSlowSpeed). Both follow the role on the card tick (_pcCloneTick), its share of health kept, so wearing it heals nothing.
// Only the Mutator's own clone (its primary clone) is touched.
function playerMutRole() { const r = playerRole(); return r && r.match === "mutator" && r.kit ? r : null; }
function _pcMyClone(c) { return !!c && c.isClone === true && !!c.primary && c.team === "green" && !c.dead; }
// THE ELEMENT OF THE CLONE'S BITE (rule 2; SPLICER's: its last kill's), or null (no role: none, as before)
function playerCloneElement(c) { if (!_pcMyClone(c)) return null; const r = playerMutRole(); return !r ? null : r.kit.splice ? (c._pcSplice || null) : r.kit.el; }
// THE CLONE'S BITE HAS LANDED on `t` (`dealt` of it): the status its role's kit sets (PLAGUE DOCTOR, SPARK GENETICIST, CORE SHAPER: the role's element's; SPLICER: its last kill's element's). A creature the bite
// killed takes nothing. True when a status was asked for.
function playerCloneBit(c, t, dealt) {
    if (!t || !_pcMyClone(c)) return false;
    const r = playerMutRole(), mend = !!(r && r.kit.biteMend) && (dealt || 0) > 0;
    if (mend && typeof elementMend === "function") elementMend(c, { any: true });   // HERBALIST (BLOOM, build 2026-11-09a): every bite that lands MENDs (as BLOOM's MEND: a hit that does damage)
    if (typeof equipElementStatus !== "function") return mend;
    const el = !r ? null : r.kit.splice ? c._pcSplice : r.kit.bite ? r.kit.el : null; if (!el) return mend;
    equipElementStatus(c, t, el, dealt || 0); return true;
}
// HERBALIST: what your serum's pool heals, as a multiple (1 without the role: js/serum.js)
function playerSerumHealMult() { const r = playerMutRole(); return r && r.kit.poolHeal > 0 ? 1 + r.kit.poolHeal : 1; }
// SPLICER: a creature has died (js/game.js, once a creature): if your clone killed it and it had an element, the clone's bites take that element from now on
function playerCloneKill(a) {
    const c = a && a.lastAttacker; if (!_pcMyClone(c) || !a.element) return null;
    const r = playerMutRole(); if (!r || !r.kit.splice) return null;
    if (c._pcSplice !== a.element) {
        c._pcSplice = a.element;
        const E = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === a.element) : null;
        if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: c.x, y: c.y, text: "SPLICED: " + (E ? E.label : String(a.element).toUpperCase()), color: E ? E.color : "#dd88ff", size: 12, life: 60, vy: -0.03 });
    }
    return c._pcSplice;
}
// ASH SURGEON, PLAGUE DOCTOR: a heal beat of the serum's pool `z` (js/serum.js): every creature in it takes the role's status. How many did.
function playerSerumBeat(z) {
    const r = playerMutRole(); if (!r || !r.kit.pool || !z || typeof equipElementStatus !== "function") return 0;
    const R = typeof SERUM !== "undefined" ? SERUM.splash.radius : 2.6; let n = 0;
    for (const a of _pcFoes()) if (Math.hypot(a.x - z.x, a.y - z.y) <= R) { equipElementStatus(z, a, r.kit.el); n++; }
    return n;
}
// CRYO GENETICIST: does a fallen follower come back at no cost to the Crystal now? Is the clone that has just fallen preserved at once?
function playerReviveFree() { const r = playerMutRole(); return !!(r && r.kit.freeRevive); }
function playerClonePreserved() { const r = playerMutRole(); return !!(r && r.kit.preserve); }
// CORE SHAPER: the clone's extra health, a share of its health added as ARMOR's ranks add (0 with no such role)
function playerCloneHealth(c) { if (!_pcMyClone(c)) return 0; const r = playerMutRole(); return r && r.kit.tank ? r.kit.tank.health : 0; }
// on the card tick: the clone's health and pace follow the role. Its health is made again only when the role's share changes, keeping the share of its health it had (so putting the card on and off heals nothing).
function _pcCloneTick() {
    const c = typeof mutatorClone === "function" ? mutatorClone() : null; if (!c) return;
    const t = (playerMutRole() || { kit: {} }).kit.tank, hp = t ? t.health : 0;
    if ((c._pcHp || 0) !== hp) {
        const share = c.maxHealth > 0 ? Math.max(0, Math.min(1, c.health / c.maxHealth)) : 1;
        c._pcHp = hp; if (typeof cloneApplyUpgrades === "function") cloneApplyUpgrades(c);
        c.health = Math.min(c.maxHealth, share * c.maxHealth);
    }
    const pace = t && t.slower > 0 ? 1 - t.slower : 1;
    c.paceMult = pace < 1 ? pace : undefined;
}
