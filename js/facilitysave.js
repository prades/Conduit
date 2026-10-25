// ─────────────────────────────────────────────────────────
//  THE FACILITY'S SAVE, AND WHICH GAME THE PAGE OPENS (docs/TUTORIAL.md, "Saving, and the two games")
// ─────────────────────────────────────────────────────────
// The page opens the FACILITY (the pre-made map and its tutorial) by default; the old strip game is the CLASSIC GAME, one chip away (and `?classic` in the address). The choice is remembered
// (localStorage "conduit_mode"). The two games do not share a save: the classic game keeps its own keys ("tubecrawler_*"), which the facility never writes (js/facilityplay.js _fpNoStorage lets only
// the keys below through), and the facility keeps one key of its own, "conduit_fp_save".
//
// WHAT IS SAVED: the class and its perks, the pack and the ammunition, which supply cases have been taken, the weapon in hand and its level, which relays are online (their rooms have power again), how far through the tutorial the player is
// (the director's step and what it has already said), the followers (the strip's own roster record: level, XP, evolution, traits), the Crystal's health and where the player stands.
// WHAT IS NOT: the enemies (an assault in progress starts again with its countdown), a repair or a build in progress (it is begun again), cooldowns, the lamp's overcharge.
// It is written every few seconds while the game is running, and when the page is hidden or closed. NEW GAME (a chip, with a confirmation) throws it away and starts again.
const FS = { key: "conduit_fp_save", mode: "conduit_mode", version: 1, every: 180 };

function _fsSearch() { return typeof window !== "undefined" && window.location ? window.location.search || "" : ""; }
// which game the page opens: "facility" (the default) or "classic"
function facilityMode() {
    if (typeof attractOn === "function" && attractOn()) return "facility";   // (the website's background: js/attract.js)
    if (/[?&]classic\b/.test(_fsSearch())) return "classic";
    if (/[?&]facilityplay\b/.test(_fsSearch())) return "facility";
    try { return typeof localStorage !== "undefined" && localStorage.getItem(FS.mode) === "classic" ? "classic" : "facility"; } catch (e) { return "facility"; }
}
function facilityModeSet(m) { try { localStorage.setItem(FS.mode, m === "classic" ? "classic" : "facility"); } catch (e) {} }
// a switch of game is a reload (each game is a whole page's worth of state); the address loses `?classic` / `?facilityplay` so the saved choice rules
function facilitySwitchGame(m) {
    facilityModeSet(m); if (_fp) _fp.saveReady = false;
    try { const u = new URL(window.location.href); u.searchParams.delete("classic"); u.searchParams.delete("facilityplay"); window.location.href = u.toString(); } catch (e) { try { location.reload(); } catch (e2) {} }
}

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
        followers: typeof followerRosterSnapshot === "function" ? followerRosterSnapshot() : [],
        weapon: typeof weaponSnapshot === "function" ? weaponSnapshot() : null,
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
// NEW GAME: throw the save away and open a fresh facility
function facilityNewGame() { facilitySaveClear(); facilitySwitchGame("facility"); }

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
    if (Number.isFinite(d.crystal) && crystal.maxHealth) crystal.health = Math.max(1, Math.min(crystal.maxHealth, d.crystal));
    // where the player stood (if that is still floor), and the followers with them
    const at = d.at; if (at && Number.isFinite(at[0]) && Number.isFinite(at[1]) && facilityStandOk(at[0], at[1])) { player.x = player.targetX = player.visualX = at[0]; player.y = player.targetY = player.visualY = at[1]; player.fpPath = null; }
    for (const f of followers) { f.x = player.x + (Math.random() - 0.5) * 1.2; f.y = player.y + (Math.random() - 0.5) * 1.2; f.returningToCrystal = false; }
    if (typeof updateObjectiveUI === "function") updateObjectiveUI();
    return true;
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
