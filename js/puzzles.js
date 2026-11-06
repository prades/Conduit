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
//   THE SEWER SAMPLE: the WATER SAMPLE vial lies at the far end of the COLLAPSED TUNNEL's floor off the north ledge (pk_sewer_sample): a broken-off stretch of an old side tunnel, open onto the ledge and in plain sight,
//   six tiles across and four deep, its whole mouth choked with the collapse's rubble (the solid `sewer_choke`, the rubble `rubble_sewer_choke`): no one walks in. Two ways to it, EACH ON ITS OWN (one technician, one
//   ability; no two of them needed together). (There were three: A, the flux technician's TELEGRAB, went with Telegrab (the owner, 2026-11-06: "Retire it now"; docs/FLUX-MOVEMENT.md). The letters are kept.)
//     B. THE LAUNCHER (the electric technician's): it sets a Kinetic Launcher up on the ledge by the mouth (the site site_sewer_tunnel: a POCKET site that carries the player, `rider`); the player taps the launcher's tag
//        twice and RIDES it over the choke onto the floor, walks to the vial and takes it, and JUMPS back down to the ledge from the floor's BROKEN EDGE (the site's `drop`, one way). Followers may be sent over too:
//        they wait up there for the player and drop after them.
//     C. THE DRILL (the fire technician's): the choke is drilled from the LEDGE (its work spot is in front of the pile: six hits a second apart), which opens the solid for good: the floor joins the ledge, and the
//        player (and everyone) walks in to the vial.
//   The record says which did it (`how`: ride or drill; a game saved before Telegrab went may say "telegrab": kept as it is, and read as no row of the table, js/puzzles.js puzzleSolution).
const PUZZLES = {
    sewer_sample: {
        id: "sewer_sample", title: "THE WATER SAMPLE", room: "sewers", quest: "purify",
        objects: {
            sample: { id: "pk_sewer_sample", kind: "pickup", item: "sewer_sample", where: "the far (east) end of the collapsed tunnel's floor off the north ledge" },
            choke: { id: "rubble_sewer_choke", kind: "rubble", solid: "sewer_choke", where: "the tunnel's whole mouth, six tiles of it", hits: 6, inside: false },
            site: { id: "site_sewer_tunnel", kind: "launchSite", pocket: true, rider: true, where: "the ledge a tile west of the mouth; its broken edge at the west end of the floor beyond" },
        },
        solutions: [
            { id: "ride", title: "THE LAUNCHER", follower: "electric", ability: "launch", steps: ["setup", "ride", "walk", "pickup", "jump"],
              text: "THE ELECTRIC TECHNICIAN SETS A LAUNCHER UP BY THE TUNNEL; YOU RIDE IT OVER THE RUBBLE, TAKE THE VIAL, AND JUMP BACK DOWN FROM THE BROKEN EDGE." },
            { id: "drill", title: "THE DRILL", follower: "fire", ability: "drill", steps: ["drill", "walk", "pickup"],
              text: "A FIRE TECHNICIAN DRILLS THE CHOKE THROUGH FROM THE LEDGE; THEN THE TUNNEL IS OPEN TO EVERYONE." },
        ],
        // THE INTERACTION CONTRACTS: each is enforced by the functions it names (`fns`; js/techabilities.js unless said), which give the refusals named when a condition is not met
        contracts: {
            setup:  { actor: "electric technician", via: "techSiteSetup(site)", fns: ["techSiteSetup", "techLauncherAt"], target: "the launcher site on the ledge by the tunnel's mouth",
                      needs: ["an electric technician in the squad, ready", "no launcher at the site yet"], refuses: ["SETTING IT UP NEEDS AN ELECTRIC TECHNICIAN IN YOUR SQUAD", "A LAUNCHER IS ALREADY HERE", "IT IS BEING SET UP"],
                      does: "the launcher is built over TECH_AB.launch.setup frames and stays for good (saved: launchers)", retry: "walking away interrupts nothing of it; a built launcher is never built again" },
            ride:   { actor: "the player", via: "techSiteRide(site) (the launcher's tag, twice)", fns: ["techSiteRide", "techFlightStep", "facilityPlayerStep"], target: "the launcher at the site, up",
                      needs: ["the launcher is up and not in use", "the site carries a rider (`rider`)", "the player is not up there already, not in the air, not in a doorway", "a way to walk to the pad"],
                      refuses: ["IT THROWS FOLLOWERS ONLY", "NO LAUNCHER HERE YET", "NOT NOW", "THE LAUNCHER IS IN USE", "YOU ARE UP THERE ALREADY", "NO WAY TO THE LAUNCHER FROM HERE"],
                      does: "the player walks to the pad and is thrown the site's arc (TECH_AB.launch.siteFlight frames; nothing else moves them and no wall or solid stops them: facilityPlayerStep) to the site's `land` on the floor beyond the choke", retry: "a refused ride changes nothing; the launcher is reusable; a walk elsewhere calls the ride off, and so does not reaching the pad in TECH_AB.launch.loadWait" },
            launch: { actor: "any squad follower, picked", via: "techSiteLaunch(site, follower)", fns: ["techSiteLaunch", "techFlightStep"], target: "the site, with its launcher up",
                      needs: ["the launcher is up and not in use", "the follower is not up there already"], refuses: ["NO LAUNCHER HERE YET", "THE LAUNCHER IS IN USE", "IT IS IN THERE ALREADY"],
                      does: "the follower flies the arc and lands at `land`; it waits there (_pocketHold, still a squad member) until the player is up there too or the way is open, or it is called (COME) or ordered; without the player up there it then drops from the broken edge (_techDropScan)", retry: "a refused launch changes nothing" },
            jump:   { actor: "the player (a follower up there without them goes by itself)", via: "techSiteDrop(site) (the broken edge's tag, ▼ JUMP DOWN)", fns: ["techSiteDrop", "techFlightStep"], target: "the site's `drop`, the floor's broken edge",
                      needs: ["the player is on the floor's stretch", "the floors are still apart (the choke shut)", "a way to walk to the edge"], refuses: ["NO BROKEN EDGE HERE", "NOT NOW", "YOU ARE NOT UP THERE", "THE WAY DOWN IS OPEN · WALK", "NO WAY TO THE EDGE FROM HERE"],
                      does: "the player walks to the edge and drops (TECH_AB.launch.dropFlight frames) to `dropTo` on the ledge: one way, the launcher is the way back up", retry: "a walk elsewhere calls it off; it can be tapped again" },
            drill:  { actor: "fire technician, on the ledge", via: "techRingAct(rubble, 'drill') or techRubbleDrill(rubble)", fns: ["techRingAct", "techRubbleDrill", "techRubbleOpen", "facilitySolidOpen"], target: "the choke's work spot, on the ledge in front of the pile's middle",
                      needs: ["a fire technician in the squad, ready", "it can walk to the work spot (_techCanReach: the same stretch of floor; it always is from the ledge)"],
                      refuses: ["THE THERMITE DRILL NEEDS A FIRE TECHNICIAN IN YOUR SQUAD", "IT IS DRILLED THROUGH", "IT IS BEING DRILLED", "IT CANNOT GET TO THE RUBBLE FROM HERE"],
                      does: "six hits a second apart (saved: rubble hits, so a load keeps the count); the sixth opens the choke's solid (facilitySolidOpen): the floor joins the ledge for good, and three rocks lie in front of the pile", retry: "the hits so far stay; an interrupted drill goes on from them" },
            walk:   { actor: "the player (and the squad)", via: "facilityPath / facilityStandOk (js/facilityplay.js)", fns: ["facilityPath", "facilityStandOk"], target: "the tunnel's floor", needs: ["the choke is open, or the player rode over (then the floor alone)"], refuses: ["(no path: the tap walks as far as the rubble)"], does: "the floor is a part of the room: entered, left and re-entered like any floor" },
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
// the live state of a puzzle: { id, solved, how, solvedAt, sampleTaken, chokeOpen, launcherUp, inside, up } (how: the solution's id, "ride" or "drill"; "" until it is solved; inside: a follower waiting on the
// floor beyond the choke; up: the player is on that floor while the choke is still shut, which is how a vial taken on foot there was got: the ride)
function puzzleState(id) {
    const D = PUZZLES[id]; if (!D) return null;
    const R = puzzleRecord(id), pk = _puzzlePickup(D.objects.sample.id), S = D.objects.site;
    const taken = !!(pk && pk.taken) || (typeof _fp !== "undefined" && _fp && Array.isArray(_fp.taken) && _fp.taken.includes(D.objects.sample.id));
    const chokeOpen = typeof facilitySolidIsOpen === "function" && facilitySolidIsOpen(D.objects.choke.solid);
    const launcherUp = typeof techLauncherAt === "function" && !!techLauncherAt(S.id);
    const site = typeof _techSite === "function" ? _techSite(S.id) : null;
    const up = !!(site && !chokeOpen && typeof _pComp === "function" && typeof player !== "undefined" && _pComp(player.x, player.y) === _pComp(site.land[0], site.land[1]));
    const inside = typeof followers !== "undefined" ? followers.some(f => f && !f.dead && f._pocketHold === S.id) : false;
    if (taken && !R.solvedAt) { R.how = chokeOpen ? "drill" : up ? "ride" : "other"; R.solvedAt = _puzzleNow(); }
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
