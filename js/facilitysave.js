// ─────────────────────────────────────────────────────────
//  THE FACILITY'S SAVE (docs/TUTORIAL.md, "Saving")
// ─────────────────────────────────────────────────────────
// The facility is the game: the page opens it, and it keeps one key, "conduit_fp_save". (The old strip game, its CLASSIC GAME chip and its "tubecrawler_*" keys are gone.)
//
// WHAT IS SAVED: the class and its perks, the pack and the ammunition, which supply cases have been taken, the weapon in hand and its level, which relays are online (their rooms have power again), how far through the tutorial the player is
// (the director's step and what it has already said), the followers (the roster record: level, XP, evolution, traits), the clones (live, or waiting to come back), the crystals and the kill count, the Crystal's health and where the player stands.
// WHAT IS NOT: the enemies (an assault in progress starts again with its countdown), a repair or a build in progress (it is begun again), cooldowns, the lamp's overcharge.
// It is written every few seconds while the game is running, and when the page is hidden or closed. NEW GAME (a chip, with a confirmation) throws it away and starts again.
const FS = { key: "conduit_fp_save", version: 1, every: 180 };

function facilitySaveLoad() {
    if (typeof attractOn === "function" && attractOn()) return null;   // (the background starts a fresh facility and keeps nothing)
    try { const d = JSON.parse(localStorage.getItem(FS.key) || "null"); return d && d.v === FS.version ? d : null; } catch (e) { return null; }
}
function facilitySaveCollect() {
    const S = _fp.tut && _fp.tut.script;
    return {
        v: FS.version,
        cls: typeof playerClassKey !== "undefined" ? playerClassKey : null, perks: Array.from(classPerks), inv: playerInv, ammo: playerAmmo, shots: playerShotsFired,
        taken: _fp.items.filter(i => i.fp === "pickup" && i.taken && !i.temp).map(i => i.id),
        relays: Object.keys(_fp.relays || {}).filter(id => _fp.relays[id].online),
        script: S ? { step: S.step, baseFollowers: S.baseFollowers, done: S.doneAt ? 1 : 0, said: S.said, kills: S.kills, gunBase: S.gunBase, strays: S.strays } : null,
        followers: followerRosterSnapshot(),
        dna: typeof getDNA === "function" ? getDNA() : {},   // the splices the Clone Bay spends (js/clone.js)
        clones: cloneRosterSnapshot(),   // the clones: alive, or waiting at the Crystal to come back
        bodies: typeof cloneBodiesSnapshot === "function" ? cloneBodiesSnapshot() : [],   // the Mutator's fallen clone, a follower fallen for good, a capsule on the floor (js/mutator.js, js/specimen.js)
        capsules: typeof specimenSnapshot === "function" ? specimenSnapshot() : [],     // the specimen capsules in the pack (js/specimen.js)
        serum: typeof serumSnapshot === "function" ? serumSnapshot() : null,           // the Mutator's laboratory: what it holds and how far through its round (js/serum.js)
        mxp: typeof mutatorXp !== "undefined" ? mutatorXp : 0,                          // the Mutator's experiment points: its level (js/mutator.js)
        tc: typeof technoSnapshot === "function" ? technoSnapshot() : 0,                // the charges in the Technomancer's gauntlet (js/technomancer.js)
        spots: typeof followerSpotsSnapshot === "function" ? followerSpotsSnapshot() : {},   // (the delay still to run on each empty follower spot)
        weapon: typeof weaponSnapshot === "function" ? weaponSnapshot() : null,
        shards: shardCount, kills: lifetimeKills,   // the crystals a kill pays (js/drops.js), and how many kills
        crystal: crystal.health, at: [Math.round(player.x * 100) / 100, Math.round(player.y * 100) / 100],
    };
}
function facilitySaveWrite() {
    if (!_fp || !_fp.saveReady) return false;
    try { const s = JSON.stringify(facilitySaveCollect()); if (s !== _fp.saveLast) { localStorage.setItem(FS.key, s); _fp.saveLast = s; } return true; } catch (e) { return false; }
}
// each frame (from facilityTutorialTick): a few seconds apart
function facilitySaveTick() {
    if (!_fp || !_fp.saveReady) return;
    const f = typeof frame !== "undefined" ? frame : 0; if (f - (_fp.saveAt === undefined ? -1e9 : _fp.saveAt) < FS.every) return;
    _fp.saveAt = f; facilitySaveWrite();
}
function facilitySaveClear() { try { localStorage.removeItem(FS.key); } catch (e) {} if (_fp) { _fp.saveReady = false; _fp.saveLast = null; } }
// NEW GAME: throw the save away and open a fresh facility (a reload: a game is a whole page's worth of state; a stale `?facilityplay` or `?classic` in the address is dropped on the way)
function facilityNewGame() {
    facilitySaveClear(); if (_fp) _fp.saveReady = false;
    try { const u = new URL(window.location.href); u.searchParams.delete("classic"); u.searchParams.delete("facilityplay"); window.location.href = u.toString(); } catch (e) { try { location.reload(); } catch (e2) {} }
}

// put a saved game back, once the facility is built and its tutorial begun (js/facilityplay.js facilityPlayStart; the followers are spawned there from the same record)
function facilitySaveApply(d) {
    if (!d || !_fp || !_fp.tut) return false;
    const F = _fp.F, S = _fp.tut.script;
    // the player: class (no start kit again: the pack is the saved one), perks, pack, ammunition
    invReset(); playerClassKey = CLASSES[d.cls] ? d.cls : null; classPicker_off();
    classPerks = new Set((d.perks || []).filter(id => CLASS_PERKS[id])); playerInv = d.inv && typeof d.inv === "object" ? d.inv : {};
    if (Number.isFinite(d.ammo)) playerAmmo = d.ammo; if (Number.isFinite(d.shots)) playerShotsFired = d.shots;
    if (typeof invButtonShow === "function") invButtonShow(true);
    if (typeof weaponRestore === "function") weaponRestore(d.weapon);   // the weapon in hand, the rifle if it was assembled, the levels and the charge
    // the relays that were online: their rooms have power (silently: no surge, no message), and what waited for them is there
    for (const id of (d.relays || [])) { const R = _fp.relays && _fp.relays[id], def = typeof _relayDef === "function" ? _relayDef(id) : null; if (!R || !def) continue; R.online = true; for (const room of def.powers) facilityPower(room, true); if (typeof facilityNeedsEnter === "function") facilityNeedsEnter(id, true); }
    // the supply cases: a class's own are there once the class is, and the ones that were taken are gone
    if (playerClassKey) for (const p of (F.pickups || [])) if (p.class === playerClassKey && !_fp.items.some(i => i.fp === "pickup" && i.id === p.id)) _fp.items.push(_fpPickupItem(p));
    const taken = new Set(d.taken || []); for (const it of _fp.items) if (it.fp === "pickup" && taken.has(it.id)) it.taken = true;
    // the tutorial: where it had got to (an assault in progress begins again; the followers that are back are not levelled again)
    if (S && d.script) {
        S.step = Math.max(0, Math.min(TUT_STEPS.length, d.script.step | 0)); S.baseFollowers = Number.isFinite(d.script.baseFollowers) ? d.script.baseFollowers : S.baseFollowers;
        S.doneAt = d.script.done ? 1 : 0; S.said = d.script.said || {}; S.kills = d.script.kills || 0; S.gunBase = d.script.gunBase; S.strays = d.script.strays || 0; S.assault = null;
        S.levelled = new Set(followers);
        if (S.doneAt && !playerClassKey && typeof classPickerOpen !== "undefined") classPickerOpen = true;   // (the picker was open when it was left)
    }
    if (d.spots && typeof followerSpotsApply === "function") followerSpotsApply(d.spots);
    if (d.dna && typeof d.dna === "object" && typeof dnaApply === "function") dnaApply(d.dna);
    if (Array.isArray(d.clones)) cloneRosterApply(d.clones);
    if (Array.isArray(d.bodies) && typeof cloneBodiesApply === "function") cloneBodiesApply(d.bodies);
    if (typeof specimenApply === "function") specimenApply(d.capsules);   // (and the pack's count of them is theirs)
    if (typeof serumApply === "function") serumApply(d.serum);
    if (Number.isFinite(d.mxp) && typeof mutatorXp !== "undefined") mutatorXp = Math.max(0, d.mxp);
    if (typeof technoApply === "function") technoApply(d.tc);
    if (Number.isFinite(d.shards)) shardCount = Math.max(0, d.shards | 0); if (Number.isFinite(d.kills)) lifetimeKills = Math.max(0, d.kills | 0);
    if (Number.isFinite(d.crystal) && crystal.maxHealth) crystal.health = Math.max(1, Math.min(crystal.maxHealth, d.crystal));
    // where the player stood (if that is still floor), and the followers with them
    const at = d.at; if (at && Number.isFinite(at[0]) && Number.isFinite(at[1]) && facilityStandOk(at[0], at[1])) { player.x = player.targetX = player.visualX = at[0]; player.y = player.targetY = player.visualY = at[1]; player.fpPath = null; }
    for (const f of followers) { f.x = player.x + (Math.random() - 0.5) * 1.2; f.y = player.y + (Math.random() - 0.5) * 1.2; f.returningToCrystal = false; }
    if (typeof partyPlacePosted === "function") partyPlacePosted();   // the followers that held rooms are in them again (js/party.js)
    return true;
}
// ── THE FOLLOWERS' RECORD: what the save keeps of each (and a dead one waiting to come back), and a follower made from it again ──
function followerRosterSnapshot() {
    const armyNow = [
        ...followers.filter(a => !a.dead && !a.sacrificed && a.isFollower && a.personality),
        ...actors.filter(a => a.team === "green" && a.returningToCrystal && !a.dead && !a.sacrificed && a.personality && !followers.includes(a)),
        ...respawnQueue.filter(e => !e.isClone && !e.sacrificed && e.personality)
    ];
    return armyNow.map(followerRecord);
}
// one follower's record (a live one, or one waiting to respawn); also what a fallen follower's preserved body keeps (js/specimen.js)
function followerRecord(a) {
    return {
        element: a.element || "fire", personality: a.personality, combatTrait: a.combatTrait, naturalTrait: a.naturalTrait, perk: a.perk, stats: a.stats, role: a.role,
        uid: a.uid || null, partnerUid: a.partnerUid || null,   // its bond (js/bonds.js)
        base: a.base || undefined, level: a.level, xp: a.xp,   // its level (js/levels.js); one waiting to respawn carries its own
        evolved: a.evolved || undefined, evoWait: a._evoOnLevelUp || undefined,   // js/evolution.js
        playStyle: a.playStyle || undefined,   // js/commandcenter.js
        post: a.post || undefined,             // the room it holds (js/party.js)
        move: a.move || undefined              // the signature move it was given (js/moves.js)
    };
}
function spawnFollowerFromSave(entry) {
    const npc = followerBuild(entry);
    actors.push(npc); followers.push(npc);
    if (!followerByElement[npc.element]) followerByElement[npc.element] = [];
    followerByElement[npc.element].push(npc);
    if (typeof partyAdmit === "function") partyAdmit(npc);   // (more than the squad's three come back posted where they are)
    return npc;
}
// a follower made from its record, not yet in the world (the save above; a fallen follower's body is drawn from one: js/specimen.js)
function followerBuild(entry) {
    const personality = entry.personality || PERSONALITY_KEYS[Math.floor(Math.random() * PERSONALITY_KEYS.length)];
    const stats = entry.stats || applyPersonality(personality);
    const role = entry.role || assignRole(stats);
    const npc = {
        type: "virus", element: entry.element || "fire", x: crystal.x + (Math.random() - 0.5) * 2, y: crystal.y + (Math.random() - 0.5) * 2, team: "green",
        health: (stats.hp || 10), maxHealth: (stats.hp || 10), moveSpeed: NPC_TYPES["virus"].moveSpeed + ((stats.speed || 10) - 10) * 0.001, power: (stats.attack || 5),
        stats, personality, role, currentResonance: 0, currentWill: stats.will || 20, walkCycle: 0, moveCooldown: 0, stance: "follow", isFollower: true, isHealing: false, hitFlash: 0, dead: false,
        combatTrait: entry.combatTrait, naturalTrait: entry.naturalTrait, perk: entry.perk
    };
    if (typeof bondRestoreFields === "function") bondRestoreFields(npc, entry);
    if (entry.evolved && typeof EVOLUTIONS !== "undefined" && EVOLUTIONS[entry.evolved]) npc.evolved = entry.evolved;   // (set before its level, so the evolved stats apply)
    if (entry.evoWait && !npc.evolved) npc._evoOnLevelUp = true;
    if (entry.move) npc.move = entry.move;
    if (entry.playStyle) npc.playStyle = entry.playStyle;
    if (typeof initFollowerLevel === "function") initFollowerLevel(npc, { base: entry.base, level: entry.level, xp: entry.xp });
    if (entry.post) { npc.post = entry.post; npc.stance = "hold"; }
    return npc;
}
// ── THE CLONES' RECORD: each live clone (its kind and level), and each one waiting to come back (with the wait still to run); made again from it (js/clone.js makeClone) ──
function cloneRosterSnapshot() {
    const out = [];
    for (const a of actors) if (a && a.isClone && !a.dead && !a.dismissed && a.speciesName) out.push({ sp: a.speciesName, cls: a.className || "scout", level: a.level, xp: a.xp, pr: a.primary ? 1 : undefined, up: a.primary ? a.upgrades || {} : undefined, inv: a.primary ? a.invested || 0 : undefined });   // pr: the Mutator's own, with its upgrades and what it cost (js/mutator.js)
    for (const e of respawnQueue) if (e && e.isClone && e.speciesName) out.push({ sp: e.speciesName, cls: e.className || "scout", level: e.level, xp: e.xp, wait: Math.max(1, e.timer | 0) });
    return out;
}
function cloneRosterApply(list) {
    if (typeof makeClone !== "function") return 0;
    let n = 0;
    for (const c of list) {
        if (!c || !c.sp) continue;
        if (c.wait > 0) { respawnQueue.push({ isClone: true, speciesName: c.sp, className: c.cls, level: c.level, xp: c.xp, timer: c.wait, totalTimer: typeof CLONE_RESPAWN_FRAMES === "number" ? CLONE_RESPAWN_FRAMES : c.wait }); n++; continue; }
        const k = makeClone(c.sp, c.cls, crystal.x + (Math.random() - 0.5) * 2, crystal.y + (Math.random() - 0.5) * 2, "wander", { level: c.level, xp: c.xp }); if (k) { if (c.pr && typeof mutatorCloneRestore === "function") mutatorCloneRestore(k, c); else if (c.pr) k.primary = true; n++; }
    }
    return n;
}
function classPicker_off() { if (typeof classPickerOpen !== "undefined") classPickerOpen = false; }

// the page's own: save when it is hidden or closed
function initFacilitySave() {
    if (typeof window === "undefined" || !window.addEventListener) return;
    const w = () => { if (typeof facilityPlay !== "undefined" && facilityPlay) facilitySaveWrite(); };
    window.addEventListener("pagehide", w); window.addEventListener("beforeunload", w);
    if (typeof document !== "undefined" && document.addEventListener) document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") w(); });
}
try { initFacilitySave(); } catch (e) { /* no page (the test sandbox) */ }
