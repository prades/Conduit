// ─────────────────────────────────────────────────────────
//  THE PUZZLES: one table of definitions and interaction contracts; the Sewers' sample (docs/SEWER-QUEST.md)
// ─────────────────────────────────────────────────────────
// ASKED (the "Series 2, Sewers, bosses" brief): "a reusable approach to data-driven puzzle definitions and interaction contracts for future environments [...] puzzle object definitions, ability compatibility rules,
// traversal rules, and interaction contracts [...] clear, structured definitions for each puzzle element and solution path"; of the sample puzzle, first "exactly two intended solutions [...] Do not implement Telegrab as
// a visual effect that does not actually retrieve the sample", then (the owner, 2026-10-31): "redo the tunnel puzzle [...] the player can use one of three options and doesn't have to rely on two of the techniques used
// together, rather just one. So you can either telegrab the item, or you can use a launch pad, and the launch pad is supposed to launch the player as well, and you could pick it up that way and then jump down or to the
// main platform from there [...] it should be basically be a broken off part of the sewer system. And then the final way to get it is to break apart a piece of rubble or whatever, and you can walk there yourself.
// Redesign the tunnel a little bit so it's wider and can accommodate a puzzle platform like this."
// A PUZZLE here is a row of PUZZLES: the world objects it is made of (by their ids in js/facilitymap.js), the SOLUTIONS, and the CONTRACTS, one for each interaction a solution uses: who does it, through which function
// of the game (the puzzle has no logic of its own: each contract names the code that enforces it, and the refusals that code gives, word for word, so the tests can hold the game to them), what it needs, and what it
// does. `puzzleState(id)` reads the live world and says whether it is solved and HOW (which solution did it): js/quests.js questTick records that in the quest line.
//   THE SEWER SAMPLE (moved 2026-11-07, the owner: "a little water sample is on the other side of the bank of the river and the player can use the ice bridge to get across to get to it and it also includes the
//   thermite brawlers rock formation breakable to retrieve the item as well"; then "Ice or drill", "Launch over the river", "Pipe shortcut"): the WATER SAMPLE vial (pk_sewer_sample) lies on the SAMPLE BANK, the
//   west end of the south bank (four tiles by five): the river on one side, the end wall on another, and a ROCK FALL across the south ledge (the solid `sewer_bank_rock`, the rubble `rubble_sewer_bank`) on the
//   third: no one walks onto it. Three ways to it, EACH ON ITS OWN (one technician, one ability). (A, TELEGRAB, went with Telegrab, 2026-11-06; the letters are kept. Until 2026-11-07 the vial lay in the
//   COLLAPSED TUNNEL off the north ledge, whose choke is still there to drill, the floor behind it empty.)
//     B. THE LAUNCHER (the electric technician's): it sets a Kinetic Launcher up on the north ledge across the river (the site site_sewer_tunnel, its id kept for saves: a POCKET site that carries the player); the
//        player taps its tag twice and RIDES it over the river onto the bank, takes the vial, and goes back through the DRAIN PIPE in the bank's back wall (portal_sewer_pipe_in), which comes out on the north
//        ledge behind a grate that opens only from inside (portal_sewer_pipe_out, `shut`): once opened it stays open, a shortcut both ways (js/facilityportals.js facilityPortalShut).
//     C. THE DRILL (the fire technician's): the rock fall is drilled from the SOUTH LEDGE (six hits a second apart), which opens it for good: the bank joins the ledge, and everyone walks on.
//     D. THE ICE BRIDGE (the ice technician's): it freezes a bridge from the north ledge across the river onto the bank (js/techabilities.js techIceBridgeAt); the player walks over, takes the vial and walks back.
//   The record says which did it (`how`: ride, drill or ice; "telegrab" from an old save is kept as it is and read as no row of the table, js/puzzles.js puzzleSolution).
const PUZZLES = {
    sewer_sample: {
        id: "sewer_sample", title: "THE WATER SAMPLE", room: "sewers", quest: "purify",
        objects: {
            sample: { id: "pk_sewer_sample", kind: "pickup", item: "sewer_sample", where: "the sample bank: the west end of the south bank, walled off by the rock fall" },
            choke: { id: "rubble_sewer_bank", kind: "rubble", solid: "sewer_bank_rock", where: "the rock fall across the south ledge at the bank's east side, five tiles of it", hits: 6, inside: false },
            site: { id: "site_sewer_tunnel", kind: "launchSite", pocket: true, rider: true, where: "the north ledge across the river from the bank" },
            pipe: { id: "portal_sewer_pipe_in", kind: "portal", to: "portal_sewer_pipe_out", where: "the drain pipe from the bank's back wall under the river to the north ledge; its ledge end opens only from inside" },
        },
        solutions: [
            { id: "ride", title: "THE LAUNCHER", follower: "electric", ability: "launch", steps: ["setup", "ride", "walk", "pickup", "pipe"],
              text: "THE ELECTRIC TECHNICIAN SETS A LAUNCHER UP ACROSS THE RIVER; YOU RIDE IT OVER, TAKE THE VIAL, AND CRAWL BACK THROUGH THE DRAIN PIPE, WHOSE GRATE THEN STAYS OPEN." },
            { id: "drill", title: "THE DRILL", follower: "fire", ability: "drill", steps: ["drill", "walk", "pickup"],
              text: "A FIRE TECHNICIAN DRILLS THE ROCK FALL THROUGH FROM THE SOUTH LEDGE; THEN THE BANK IS OPEN TO EVERYONE." },
            { id: "ice", title: "THE ICE BRIDGE", follower: "ice", ability: "frost", steps: ["bridge", "walk", "pickup"],
              text: "AN ICE TECHNICIAN FREEZES A BRIDGE ACROSS THE RIVER ONTO THE BANK; YOU WALK OVER AND BACK." },
        ],
        // THE INTERACTION CONTRACTS: each is enforced by the functions it names (`fns`; js/techabilities.js unless said), which give the refusals named when a condition is not met
        contracts: {
            setup:  { actor: "electric technician", via: "techSiteSetup(site)", fns: ["techSiteSetup", "techLauncherAt"], target: "the launcher site on the north ledge across the river from the bank",
                      needs: ["an electric technician in the squad, ready", "no launcher at the site yet"], refuses: ["SETTING IT UP NEEDS AN ELECTRIC TECHNICIAN IN YOUR SQUAD", "A LAUNCHER IS ALREADY HERE", "IT IS BEING SET UP"],
                      does: "the launcher is built over TECH_AB.launch.setup frames and stays for good (saved: launchers)", retry: "walking away interrupts nothing of it; a built launcher is never built again" },
            ride:   { actor: "the player", via: "techSiteRide(site) (the launcher's tag, twice)", fns: ["techSiteRide", "techFlightStep", "facilityPlayerStep"], target: "the launcher at the site, up",
                      needs: ["the launcher is up and not in use", "the site carries a rider (`rider`)", "the player is not up there already, not in the air, not in a doorway", "a way to walk to the pad"],
                      refuses: ["IT THROWS FOLLOWERS ONLY", "NO LAUNCHER HERE YET", "NOT NOW", "THE LAUNCHER IS IN USE", "YOU ARE UP THERE ALREADY", "NO WAY TO THE LAUNCHER FROM HERE"],
                      does: "the player walks to the pad and is thrown the site's arc (TECH_AB.launch.siteFlight frames; nothing else moves them and no wall or solid stops them: facilityPlayerStep) over the river to the site's `land` on the bank", retry: "a refused ride changes nothing; the launcher is reusable; a walk elsewhere calls the ride off, and so does not reaching the pad in TECH_AB.launch.loadWait" },
            launch: { actor: "any squad follower, picked", via: "techSiteLaunch(site, follower)", fns: ["techSiteLaunch", "techFlightStep"], target: "the site, with its launcher up",
                      needs: ["the launcher is up and not in use", "the follower is not up there already"], refuses: ["NO LAUNCHER HERE YET", "THE LAUNCHER IS IN USE", "IT IS IN THERE ALREADY"],
                      does: "the follower flies the arc and lands at `land`; it waits there (_pocketHold, still a squad member) until the player is up there too or the way is open, or it is called (COME) or ordered; then it comes back through the drain pipe (js/facilityportals.js _pFollowScan)", retry: "a refused launch changes nothing" },
            pipe:   { actor: "the player (and the squad following them; a follower left on the bank comes by itself)", via: "walking into the drain pipe's mouth (js/facilityportals.js facilityPortalTick)", fns: ["facilityPortalTick", "facilityPortalShut", "facilityPortalStart"],
                      target: "the pipe's mouth in the bank's back wall", needs: ["the player is on the bank", "for the way back in from the ledge: the grate opened from inside once"], refuses: ["(the shut grate: its tag says ITS GRATE OPENS FROM INSIDE and nothing happens)"],
                      does: "the screen fades, the player (and the squad near them) comes out on the north ledge; the grate swings open for good, a shortcut both ways (saved: pipes)", retry: "it can be crawled again either way once open" },
            drill:  { actor: "fire technician, on the south ledge", via: "techRingAct(rubble, 'drill') or techRubbleDrill(rubble)", fns: ["techRingAct", "techRubbleDrill", "techRubbleOpen", "facilitySolidOpen"], target: "the rock fall's work spot, on the south ledge east of it",
                      needs: ["a fire technician in the squad, ready", "it can walk to the work spot (_techCanReach: the same stretch of floor)"],
                      refuses: ["THE THERMITE DRILL NEEDS A FIRE TECHNICIAN IN YOUR SQUAD", "IT IS DRILLED THROUGH", "IT IS BEING DRILLED", "IT CANNOT GET TO THE RUBBLE FROM HERE"],
                      does: "six hits a second apart (saved: rubble hits, so a load keeps the count); the sixth opens the rock fall's solid (facilitySolidOpen): the bank joins the ledge for good, and three rocks lie in front of the pile", retry: "the hits so far stay; an interrupted drill goes on from them" },
            bridge: { actor: "ice technician", via: "its chip aimed at the river (techChipTap, techAimPickSpot)", fns: ["techIceBridgePlan", "techIceBridgeAt", "facilityIceSet"], target: "the river between the north ledge and the bank",
                      needs: ["an ice technician in the squad, ready", "the water in its sight, floor on both banks, at most TECH_AB.frost.bridgeMax tiles"], refuses: ["TOO WIDE TO BRIDGE · 8 TILES", "THE TECHNICIAN CANNOT SEE THERE"],
                      does: "a straight bridge 2 tiles wide, bank to bank, floor until the same technician makes its next one (saved: bridges)", retry: "its next bridge thaws this one" },
            walk:   { actor: "the player (and the squad)", via: "facilityPath / facilityStandOk (js/facilityplay.js)", fns: ["facilityPath", "facilityStandOk"], target: "the bank's floor", needs: ["the rock fall drilled, a bridge standing, or the player rode over (then the bank alone)"], refuses: ["(no path: the tap walks as far as it can)"], does: "the bank is a part of the room: entered, left and re-entered like any floor" },
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
// the live state of a puzzle: { id, solved, how, solvedAt, sampleTaken, chokeOpen, launcherUp, inside, up } (how: the solution's id, "ride", "drill" or "ice"; "" until it is solved; inside: a follower waiting on
// the bank; up: the player is on the bank while it is cut off (no rock fall drilled, no bridge), which is how a vial taken there was got: the ride)
function puzzleState(id) {
    const D = PUZZLES[id]; if (!D) return null;
    const R = puzzleRecord(id), pk = _puzzlePickup(D.objects.sample.id), S = D.objects.site;
    const taken = !!(pk && pk.taken) || (typeof _fp !== "undefined" && _fp && Array.isArray(_fp.taken) && _fp.taken.includes(D.objects.sample.id));
    const chokeOpen = typeof facilitySolidIsOpen === "function" && facilitySolidIsOpen(D.objects.choke.solid);
    const launcherUp = typeof techLauncherAt === "function" && !!techLauncherAt(S.id);
    const site = typeof _techSite === "function" ? _techSite(S.id) : null;
    const iced = !!(site && !chokeOpen && typeof _pComp === "function" && _pComp(site.land[0], site.land[1]) === _pComp(site.at[0], site.at[1]));   // (an ice bridge joins the bank to the ledge across the river)
    const up = !!(site && !chokeOpen && !iced && typeof _pComp === "function" && typeof player !== "undefined" && _pComp(player.x, player.y) === _pComp(site.land[0], site.land[1]));
    const inside = typeof followers !== "undefined" ? followers.some(f => f && !f.dead && f._pocketHold === S.id) : false;
    if (taken && !R.solvedAt) { R.how = chokeOpen ? "drill" : iced ? "ice" : up ? "ride" : "other"; R.solvedAt = _puzzleNow(); }
    return { id, solved: !!R.solvedAt, how: R.how, solvedAt: R.solvedAt, sampleTaken: taken, chokeOpen, launcherUp, inside, up };
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
