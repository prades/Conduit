// ─────────────────────────────────────────────────────────
//  THE PUZZLES: one table of definitions and interaction contracts; the Sewers' sample (docs/SEWER-QUEST.md)
// ─────────────────────────────────────────────────────────
// ASKED (the "Series 2, Sewers, bosses" brief): "a reusable approach to data-driven puzzle definitions and interaction contracts for future environments [...] puzzle object definitions, ability compatibility rules,
// traversal rules, and interaction contracts [...] clear, structured definitions for each puzzle element and solution path"; and of the sample puzzle: "exactly two intended solutions [...] Do not add a third intended
// solution or silently make the puzzle trivial. Do not implement Telegrab as a visual effect that does not actually retrieve the sample."
// A PUZZLE here is a row of PUZZLES: the world objects it is made of (by their ids in js/facilitymap.js), the two SOLUTIONS, and the CONTRACTS, one for each interaction a solution uses: who does it, through which
// function of the game (the puzzle has no logic of its own: each contract names the code that enforces it, and the refusals that code gives, word for word, so the tests can hold the game to them), what it needs,
// and what it does. `puzzleState(id)` reads the live world and says whether it is solved and HOW (which solution did it): js/quests.js questTick records that in the quest.
//   THE SEWER SAMPLE: the WATER SAMPLE vial lies at the end of the collapsed tunnel off the north ledge (pk_sewer_sample), a pocket of floor the choke of rubble (the solid `sewer_choke`, the rubble `rubble_sewer_choke`)
//   shuts off from the ledge: no one walks in. The two ways to it:
//     A. TELEGRAB (the flux technician's level-1 ability, js/techabilities.js): the vial is on the screen, so it is an item the chip can take: it flies over the rubble to the player's feet, and the pickup takes it, once.
//     B. THE LAUNCHER AND THE DRILL: the electric technician sets a Kinetic Launcher up at the tunnel's foot (the site site_sewer_tunnel: a POCKET site, which lands its passenger inside the tunnel and takes only a
//        fire technician); the fire technician is sent in, and from inside it drills the choke (six hits), which opens the solid for good: the tunnel joins the ledge, and the player (and everyone) walks in to the vial.
//   NOT a third way: the choke cannot be drilled from the ledge (the work spot is inside; the drill order from outside is refused and says how to get in), no one but a fire technician is launched in, and nothing
//   else moves the rubble.
const PUZZLES = {
    sewer_sample: {
        id: "sewer_sample", title: "THE WATER SAMPLE", room: "sewers", quest: "purify",
        objects: {
            sample: { id: "pk_sewer_sample", kind: "pickup", item: "sewer_sample", where: "the end of the collapsed tunnel off the north ledge" },
            choke: { id: "rubble_sewer_choke", kind: "rubble", solid: "sewer_choke", where: "the tunnel's mouth", hits: 6, inside: true },
            site: { id: "site_sewer_tunnel", kind: "launchSite", pocket: true, only: "fire", where: "the ledge at the tunnel's foot" },
        },
        solutions: [
            { id: "telegrab", title: "TELEGRAB", follower: "flux", ability: "grab", steps: ["grab", "pickup"],
              text: "A FLUX TECHNICIAN'S TELEGRAB PULLS THE VIAL OUT OVER THE RUBBLE TO YOUR FEET." },
            { id: "launch", title: "THE LAUNCHER AND THE DRILL", follower: "electric", ability: "launch", then: { follower: "fire", ability: "drill" }, steps: ["setup", "launch", "drill", "walk", "pickup"],
              text: "THE ELECTRIC TECHNICIAN SETS A LAUNCHER UP AT THE TUNNEL; A FIRE TECHNICIAN IS SENT IN AND DRILLS THE CHOKE OPEN FROM INSIDE; THEN THE TUNNEL IS OPEN TO EVERYONE." },
        ],
        // THE INTERACTION CONTRACTS: each is enforced by the functions it names (`fns`; js/techabilities.js unless said), which give the refusals named when a condition is not met
        contracts: {
            grab:   { actor: "flux technician", via: "techAbilityUse(tech, { item })", fns: ["techAbilityUse", "techItemAtScreen", "techGrabAt"], target: "an item on the floor anywhere on the screen (techItemAtScreen); the technician need not see it: no line of sight, no range but the screen",
                      needs: ["the technician is a squad member and its ability is ready (techReadyIn)", "the item is not taken and not already in flight"],
                      refuses: ["TAP AN ITEM ON THE FLOOR", "IT IS GONE"], does: "the item flies to the player's feet (TECH_AB.grab.flight frames) and is left there; the ability's cooldown begins", retry: "a refused tap keeps the aim (again: true); a grabbed item cannot be grabbed twice" },
            setup:  { actor: "electric technician", via: "techSiteSetup(site)", fns: ["techSiteSetup", "techLauncherAt"], target: "the launcher site at the tunnel's foot",
                      needs: ["an electric technician in the squad, ready", "no launcher at the site yet"], refuses: ["(no electric technician) its own refusal, techSiteSetup", "IT IS SET UP ALREADY"],
                      does: "the launcher is built over TECH_AB.launch.setup frames and stays for good (saved: launchers)", retry: "walking away interrupts nothing of it; a built launcher is never built again" },
            launch: { actor: "any squad follower, picked; the pocket admits only a fire technician", via: "techSiteLaunch(site, follower)", fns: ["techSiteLaunch", "techFlightStep"], target: "the pocket site, with its launcher up",
                      needs: ["the launcher is up", "the follower is a fire technician (the site's `only`)", "it is not in the pocket already"],
                      refuses: ["NO LAUNCHER HERE YET", "ONLY A FIRE TECHNICIAN GOES IN THERE · PICK ONE", "IT IS IN THERE ALREADY"],
                      does: "the follower flies the site's arc and lands at the site's `land` inside the tunnel; it holds there (_pocketHold) and stays a squad member; the player is told to order the drill", retry: "a refused launch changes nothing; the launcher is reusable" },
            drill:  { actor: "fire technician, inside the pocket", via: "techRingAct(rubble, 'drill') or techRubbleDrill(rubble)", fns: ["techRingAct", "techRubbleDrill", "techRubbleOpen", "facilitySolidOpen"], target: "the choke's work spot, which is inside the pocket",
                      needs: ["a fire technician in the squad, ready", "it can walk to the work spot (_techCanReach: the same component)"],
                      refuses: ["IT IS DRILLED FROM INSIDE · SEND A FIRE TECHNICIAN IN WITH THE KINETIC LAUNCHER", "IT CANNOT GET TO THE RUBBLE FROM HERE"],
                      does: "six hits a second apart (saved: rubble hits, so a load keeps the count); the sixth opens the choke's solid (facilitySolidOpen): the pocket's floor joins the ledge, the hold is let go", retry: "the hits so far stay; an interrupted drill goes on from them" },
            walk:   { actor: "the player (and the squad)", via: "facilityPath / facilityStandOk (js/facilityplay.js)", fns: ["facilityPath", "facilityStandOk"], target: "the tunnel's floor", needs: ["the choke is open"], refuses: ["(no path: the tap walks as far as the rubble)"], does: "the tunnel is a part of the room: entered, left and re-entered like any floor" },
            pickup: { actor: "the player", via: "facilityPickupTick (js/facilitytutorial.js)", fns: ["facilityPickupTick"], target: "the vial at the player's feet or where it lies", needs: ["the pack has room for it"], refuses: ["(no room: it stays on the floor)"], does: "the vial goes in the pack ONCE (the pickup is marked taken; saved: taken)" },
        },
    },
};

// ── what has happened (the record `_fp.puzzles[id]`, saved as `puzzles`): the solve, once, and how ──
function puzzleRecord(id) {
    if (typeof _fp === "undefined" || !_fp) return { solvedAt: 0, how: "" };
    if (!_fp.puzzles) _fp.puzzles = {};
    if (!_fp.puzzles[id]) _fp.puzzles[id] = { solvedAt: 0, how: "" };
    return _fp.puzzles[id];
}
function puzzleReset() { if (typeof _fp !== "undefined" && _fp) _fp.puzzles = {}; }
function _puzzleNow() { return typeof techClock === "number" ? Math.max(1, techClock) : Math.max(1, typeof frame !== "undefined" ? frame : 1); }
function _puzzlePickup(id) { return typeof _fp !== "undefined" && _fp && _fp.items ? _fp.items.find(i => i.fp === "pickup" && i.id === id) || null : null; }
// the live state of a puzzle: { id, solved, how, solvedAt, sampleTaken, chokeOpen, launcherUp, inside } (how: the solution's id, "telegrab" or "launch"; "" until it is solved)
function puzzleState(id) {
    const D = PUZZLES[id]; if (!D) return null;
    const R = puzzleRecord(id), pk = _puzzlePickup(D.objects.sample.id);
    const taken = !!(pk && pk.taken) || (typeof _fp !== "undefined" && _fp && Array.isArray(_fp.taken) && _fp.taken.includes(D.objects.sample.id));
    const chokeOpen = typeof facilitySolidIsOpen === "function" && facilitySolidIsOpen(D.objects.choke.solid);
    const launcherUp = typeof techLauncherAt === "function" && !!techLauncherAt(D.objects.site.id);
    const inside = typeof followers !== "undefined" ? followers.some(f => f && !f.dead && f._pocketHold === D.objects.site.id) : false;
    if (taken && !R.solvedAt) { R.how = pk && pk.grabbed ? "telegrab" : chokeOpen ? "launch" : "other"; R.solvedAt = _puzzleNow(); }
    return { id, solved: !!R.solvedAt, how: R.how, solvedAt: R.solvedAt, sampleTaken: taken, chokeOpen, launcherUp, inside };
}
// each frame (js/facilitytutorial.js): the records are kept up to date, so the quest reads a solve the frame it happens
function puzzleTick() { if (typeof _fp === "undefined" || !_fp || !_fp.F) return; for (const id of Object.keys(PUZZLES)) puzzleState(id); }
// the solution a puzzle was solved by, as a row of its table (null until it is)
function puzzleSolution(id) { const D = PUZZLES[id], R = D && puzzleRecord(id); return D && R && R.solvedAt ? D.solutions.find(s => s.id === R.how) || null : null; }
// ── the save (js/facilitysave.js) ──
function puzzleSnapshot() { const out = {}, Pz = typeof _fp !== "undefined" && _fp && _fp.puzzles || {}; for (const id of Object.keys(Pz)) out[id] = { solvedAt: Pz[id].solvedAt, how: Pz[id].how }; return out; }
function puzzleApply(d) {
    if (typeof _fp === "undefined" || !_fp) return false; _fp.puzzles = {};
    if (!d || typeof d !== "object") return false;
    for (const id of Object.keys(d)) { if (!PUZZLES[id] || !d[id] || typeof d[id] !== "object") continue; const R = puzzleRecord(id); R.solvedAt = Number.isFinite(d[id].solvedAt) ? Math.max(0, d[id].solvedAt) : 0; R.how = typeof d[id].how === "string" ? d[id].how : ""; }
    return true;
}
