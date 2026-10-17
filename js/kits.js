// ─────────────────────────────────────────────────────────
//  LAYOUT KITS — sixteen small equipment layouts for a zone (docs/LAYOUT-KITS.md)
// ─────────────────────────────────────────────────────────
// REPORTED: "I really want to have layouts for different equipment systems. I want them to not exaggerate unnecessary equipment. Plan out a way to make
// 16 different variants of zone equipment layouts that make sense, that will be utilized by the auto and available as build kits in the build menu in a
// separate tab." Answered: both a ghost and snap-to-nest, auto picks by a ladder, 16 layouts each usable with any element, no fixed size cap.
//
// A kit is DATA: a map of the lane (rows y 0..3, one character per column dx, dx 0 at the zone's held nest, increasing toward the front):
//     G generator   C connector   B battery   T turret (attack pylon)   W wave pylon (a formation's four)   S support pylon
// Every piece takes the kit's ONE element (the player or autoplay chooses it; `needs` says which elements a kit works with). So 16 layouts x the unlocked
// elements is the number of concrete kits.
//
// THE RULES THAT STOP IT EXAGGERATING (kitValidate, enforced by tests/kits.js on every kit):
//   R1 the batteries are exactly what the target tier needs (0, 2, 4 or 6): never a spare one
//   R2 every turret has a job: a lane gun (at most 4) or one of an Ultra square's four
//   R3 a wave pylon is one of a formation's four, or one of at most two supports; never loose
//   R4 one generator; a connector only in the kit whose point is reach
//   R5 every piece is linked and powered: connected to the generator under the real link rules
//   R6 the target is reached: the tier is the bank's, an Ultra square and a formation sit within the bank's full-strength reach
//   R7 the lane stays open: no column is blocked from row 0 to row 3, and the kit fits 4 rows x 10 columns
const KIT_LINK = 3.05;           // tiles between linked pylons (config.js getPylonRange without the relay and the heart)
const KIT_BANK_REACH = 6;        // BANK_FULL_RANGE: full network strength within this many tiles of a bank's battery
const KIT_TIER_BATTERIES = [0, 2, 4, 6];   // BATTERY_TIER_SIZES, with tier 0
const KIT_ROWS = 4, KIT_COLS = 10;

// needs: "any" element; "form" an element with a formation (flux, fire, ice, toxic, core); "support" an element whose wave pylons support (electric, core).
const KITS = [
    // ── POWER: hold a zone cheaply ──
    { id: "skeleton",     name: "SKELETON",     family: "power",    needs: "any", target: { tier: 1 },
      blurb: "Power only: a generator and a tier I bank. For a cleared zone with nothing to defend.",
      map: ["...", "GBB", "..."] },
    { id: "outpost",      name: "OUTPOST",      family: "power",    needs: "any", target: { tier: 1 },
      blurb: "The minimum that fights back: a tier I bank and two guns.",
      map: ["...", "GBB", "...TT"] },
    { id: "strongpoint",  name: "STRONGPOINT",  family: "power",    needs: "any", target: { tier: 2 },
      blurb: "A pod of four batteries (tier II): MK II turrets and formations become possible.",
      map: [".BB", "GBB", "...TT"] },
    { id: "bastion",      name: "BASTION",      family: "power",    needs: "any", target: { tier: 3 },
      blurb: "A pod of six batteries (tier III): the strongest network, over the widest area.",
      map: [".BBB", "GBBB", "...TT"] },
    // ── DEFENCE: guns ──
    { id: "relayline",    name: "RELAY LINE",   family: "defence",  needs: "any", target: { tier: 1 }, relay: true,
      blurb: "A connector by the nest feeds a forward post (two batteries, two guns) with no chain of pylons between.",
      map: ["........T.", "GC......BB", "........T."] },
    { id: "gunline",      name: "GUN LINE",     family: "defence",  needs: "any", target: { tier: 1 },
      blurb: "Four guns in a diagonal line across the lane: even fire, and a way through left open.",
      map: ["....T", "GBB.T", ".....T", ".....T"] },
    { id: "crossfire",    name: "CROSSFIRE",    family: "defence",  needs: "any", target: { tier: 1 },
      blurb: "Guns staggered on the outer rows: they cover the walls and leave the lane open.",
      map: ["...T.T", "GBB...", "......", "...T.T"] },
    { id: "ultranear",    name: "ULTRA NEAR",   family: "defence",  needs: "any", target: { tier: 2, ultra: true },
      blurb: "The STRONGPOINT with two more guns: a 2x2 that fuses into an Ultra turret, close to the nest.",
      map: [".BB", "GBB", "...TT", "...TT"] },
    { id: "ultrafront",   name: "ULTRA FRONT",  family: "defence",  needs: "any", target: { tier: 2, ultra: true },
      blurb: "The same Ultra at the zone's entrance, the bank staged in front of the nest so it still fuses.",
      map: ["...BB....", "G..BB..TT", ".......TT"] },
    // ── CONTROL: formations (any element that forms one) ──
    { id: "trap",         name: "TRAP",         family: "control",  needs: "form", target: { tier: 2, formation: true },
      blurb: "A formation mid-lane (black hole, firewall, ice generator, toxic tower, shield forge): it catches what walks through.",
      map: [".BB", "GBB..WW", ".....WW"] },
    { id: "choke",        name: "CHOKE",        family: "control",  needs: "form", target: { tier: 2, formation: true },
      blurb: "A formation at the entrance, the bank behind it: it stops them before the guns.",
      map: ["...BB....", "G..BB..WW", ".......WW"] },
    { id: "homeguard",    name: "HOME GUARD",   family: "control",  needs: "form", target: { tier: 2, formation: true },
      blurb: "A formation beside the generator, for a zone raided from the side.",
      map: [".BBWW", "GBBWW"] },
    // ── COMBINED ──
    { id: "supportnet",   name: "SUPPORT NET",  family: "combined", needs: "support", target: { tier: 1, support: true },
      blurb: "Two guns and two support pylons (haste or shields) that work on the squad standing in the lane.",
      map: ["...S", "GBB.T", "...ST"] },
    { id: "siege",        name: "SIEGE",        family: "combined", needs: "any", target: { tier: 2, ultra: true },
      blurb: "An Ultra and two more guns forward of it, for a zone attacked every night.",
      map: [".BB", "GBB...T", "...TT.T", "...TT"] },
    { id: "hardened",     name: "HARDENED",     family: "combined", needs: "any", target: { tier: 2 }, mk2: ["T"],
      blurb: "The STRONGPOINT with both guns upgraded to MK II.",
      map: [".BB", "GBB", "...TT"] },
    { id: "fullkit",      name: "FULL KIT",     family: "combined", needs: "form", target: { tier: 3, ultra: true, formation: true },
      blurb: "A pod of six, an Ultra and a formation, with the lane left open between them: the most a zone needs.",
      map: [".BBB.TT", "GBBB.TT", ".......WW", ".......WW"] },
];
const KIT_FAMILIES = [["power", "POWER"], ["defence", "DEFENCE"], ["control", "CONTROL"], ["combined", "COMBINED"]];
const KIT_KIND = { G: "generator", C: "connector", B: "battery", T: "attack", W: "wave", S: "support" };

function kitById(id) { return KITS.find(k => k.id === id) || null; }
// The pieces of a kit: [{ dx, dy, c (the map character), kind, mk2 }].
function kitPieces(kit) {
    const out = [];
    kit.map.forEach((row, dy) => { for (let dx = 0; dx < row.length; dx++) { const c = row[dx]; if (KIT_KIND[c]) out.push({ dx, dy, c, kind: KIT_KIND[c], mk2: !!(kit.mk2 && kit.mk2.indexOf(c) >= 0) }); } });
    return out;
}
function kitPieceCount(kit) { return kitPieces(kit).length; }
// Can this element be used with this kit? (Uses the game's own lists, so a new formation or support element is picked up.)
function kitElementOk(kit, el) {
    if (typeof unlockedElements !== "undefined" && !unlockedElements.has(el)) return false;
    if (kit.needs === "form") return typeof FORM_KINDS !== "undefined" && !!FORM_KINDS[el];
    if (kit.needs === "support") return typeof waveRole === "function" && waveRole(el) === "support";
    return true;
}
function kitElements(kit) { return (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).map(e => e.id).filter(e => kitElementOk(kit, e)); }
// What it costs to build it all (shards), with MK II upgrades.
function kitCost(kit) {
    const n = kitPieceCount(kit), up = kitPieces(kit).filter(p => p.mk2).length;
    return n * PYLON_BUILD_COST + up * (typeof MK2_COST !== "undefined" ? MK2_COST : 15);
}
// A 2x2 block of the same character in the map (an Ultra's turrets, a formation's wave pylons).
function _kitSquares(kit, c) {
    const at = new Set(kitPieces(kit).filter(p => p.c === c).map(p => p.dx + "," + p.dy)), out = [];
    for (const k of at) { const [x, y] = k.split(",").map(Number); if (at.has((x + 1) + "," + y) && at.has(x + "," + (y + 1)) && at.has((x + 1) + "," + (y + 1))) out.push([x, y]); }
    return out;
}

// The rules. Returns the list of violations (empty when the kit is sound).
function kitValidate(kit) {
    const bad = [], P = kitPieces(kit), n = c => P.filter(p => p.c === c);
    const tier = kit.target.tier, bats = n("B"), tur = n("T"), wav = n("W"), sup = n("S"), gens = n("G"), cons = n("C");
    // R1 the batteries are exactly the tier's
    if (bats.length !== KIT_TIER_BATTERIES[tier]) bad.push("R1: " + bats.length + " batteries for tier " + tier + " (needs " + KIT_TIER_BATTERIES[tier] + ")");
    // R2 turrets: lane guns <= 4, plus whole 2x2 squares
    const sq = _kitSquares(kit, "T"), inSq = new Set(); sq.forEach(([x, y]) => [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b]) => inSq.add((x + a) + "," + (y + b))));
    const guns = tur.filter(p => !inSq.has(p.dx + "," + p.dy));
    if (guns.length > 4) bad.push("R2: " + guns.length + " lane guns (at most 4)");
    if (sq.length > 1) bad.push("R2: " + sq.length + " Ultra squares (at most 1)");
    if (kit.target.ultra && !sq.length) bad.push("R6: an Ultra target with no 2x2 of turrets");
    if (!kit.target.ultra && sq.length) bad.push("R2: a 2x2 of turrets that nothing asked for (it would fuse into an Ultra)");
    // R3 wave pylons: one formation square, or at most two supports
    const wsq = _kitSquares(kit, "W");
    if (wav.length && (wav.length !== 4 || wsq.length !== 1)) bad.push("R3: loose wave pylons (" + wav.length + ")");
    if (kit.target.formation && wav.length !== 4) bad.push("R6: a formation target without its four wave pylons");
    if (!kit.target.formation && wav.length) bad.push("R3: a formation nothing asked for");
    if (sup.length > 2) bad.push("R3: " + sup.length + " supports (at most 2)");
    if (!!kit.target.support !== !!sup.length) bad.push("R3: supports and the support target disagree");
    // R4 one generator; a connector only where the kit is about reach
    if (gens.length !== 1) bad.push("R4: " + gens.length + " generators (exactly 1)");
    if (cons.length && !kit.relay) bad.push("R4: a connector in a kit that is not about reach");
    if (kit.relay && cons.length !== 1) bad.push("R4: a relay kit needs exactly one connector");
    // R7 the footprint: 4 rows x 10 columns, one piece a tile, the lane open
    const seen = new Set();
    for (const p of P) { if (p.dy < 0 || p.dy >= KIT_ROWS || p.dx < 0 || p.dx >= KIT_COLS) bad.push("R7: a piece off the grid at " + p.dx + "," + p.dy); const k = p.dx + "," + p.dy; if (seen.has(k)) bad.push("R7: two pieces on " + k); seen.add(k); }
    const width = Math.max(...P.map(p => p.dx)) + 1;
    for (let x = 0; x < width; x++) { let used = 0; for (let y = 0; y < KIT_ROWS; y++) if (seen.has(x + "," + y)) used++; if (used >= KIT_ROWS) bad.push("R7: column " + x + " is blocked from wall to wall"); }
    // R5 every piece is linked to the generator (pylons within KIT_LINK of each other; a connector feeds every piece within 14)
    if (gens.length === 1) {
        const g = gens[0], reach = new Set([g.dx + "," + g.dy]), queue = [g], d = (a, b) => Math.hypot(a.dx - b.dx, a.dy - b.dy);
        while (queue.length) { const a = queue.pop(); for (const b of P) { const k = b.dx + "," + b.dy; if (reach.has(k)) continue; if (d(a, b) <= KIT_LINK || (a.c === "C" && d(a, b) <= 14)) { reach.add(k); queue.push(b); } } }
        for (const p of P) if (!reach.has(p.dx + "," + p.dy)) bad.push("R5: the " + KIT_KIND[p.c] + " at " + p.dx + "," + p.dy + " is not linked to the generator");
        // the bank is one linked group (batteries within link range of each other)
        if (bats.length) { const bs = new Set([bats[0]]), q = [bats[0]]; while (q.length) { const a = q.pop(); for (const b of bats) if (!bs.has(b) && d(a, b) <= KIT_LINK) { bs.add(b); q.push(b); } } if (bs.size !== bats.length) bad.push("R5: the batteries are not one linked bank"); }
        // R6 the Ultra's tiles, the formation's tiles and the supports sit within the bank's full-strength reach
        const near = p => Math.min(...bats.map(b => d(b, p)));
        if (bats.length) {
            for (const p of tur.concat(wav, sup)) if (near(p) > KIT_BANK_REACH) bad.push("R6: the " + KIT_KIND[p.c] + " at " + p.dx + "," + p.dy + " is " + near(p).toFixed(1) + " tiles from the bank (full strength within " + KIT_BANK_REACH + ")");
        }
        if ((kit.target.ultra || kit.target.formation || kit.mk2) && tier < (kit.mk2 && !kit.target.ultra && !kit.target.formation ? 1 : 2)) bad.push("R6: the target needs a higher tier than " + tier);
    }
    if (kit.mk2 && kit.mk2.some(c => c !== "T")) bad.push("R2: only turrets are upgraded to MK II");
    return bad;
}

// ─────────────────────────────────────────────────────────
//  PLACING A KIT
// ─────────────────────────────────────────────────────────
// A kit goes where its generator sits: tile x = x0 + dir * dx, tile y = dy (the lane rows). x0 is the nest's x for SNAP TO NEST, or the tile the player points
// at for the ghost. dir is +1 (toward the front) or -1 (mirrored, for a nest with room on the other side only).
function _kitTile(x, y) { return typeof getTile === "function" ? getTile(x, y) : null; }
function _kitHaveKind(t, p, el) {
    if (!t || !t.pillar || t.destroyed || t.pillarTeam !== "green" || t.offline) return false;
    if (p.c === "G") return !!t.isGenerator;
    if (p.c === "C") return !!t.isConnector;
    if (t.attackModeElement !== el) return false;
    if (p.c === "B") return !!t.isBattery;
    if (p.c === "T") return !!t.attackMode && !t.isBattery && !t.isGenerator && !t.isConnector;
    return !!t.waveMode;   // W, S
}
// Every piece of the kit on the ground at (x0, dir): its tile and whether it is already there ("have"), free to build ("free") or blocked (with the reason).
function kitPlan(kit, el, x0, dir, nest) {
    // Every piece must stand in the zone the generator does: tech in a zone with no generator of its own has no power (power.js zoneHasGenerator).
    const zone = typeof getZoneIndex === "function" ? getZoneIndex(nest ? nest.x : x0) : 0;
    const pieces = kitPieces(kit).map(p => {
        const x = x0 + (dir || 1) * p.dx, t = _kitTile(x, p.dy), r = { piece: p, x, y: p.dy, tile: t, state: "free", why: null };
        if (t && getZoneIndex(x) !== zone) { r.state = "blocked"; r.why = "ACROSS THE ZONE LINE"; return r; }
        if (t && _kitHaveKind(t, p, el)) { r.state = "have"; if (p.mk2 && (t.mk || 0) < 2) r.mk2Missing = true; return r; }
        const why = typeof _bmTileProblem === "function" ? _bmTileProblem(t) : (t ? null : "NOTHING THERE");
        if (why) { r.state = "blocked"; r.why = why; return r; }
        if (p.c === "G" || p.c === "C") {
            if (typeof canPlaceGenerator === "function" && !canPlaceGenerator(t).ok) { r.state = "blocked"; r.why = "NEEDS A NEST WITHIN " + GENERATOR_NEST_RANGE; }
        }
        return r;
    });
    const count = s => pieces.filter(p => p.state === s).length, free = pieces.filter(p => p.state === "free");
    return { kit, el, x0, dir: dir || 1, nest: nest || null, pieces, have: count("have"), free: free.length, blocked: count("blocked"),
             cost: free.length * PYLON_BUILD_COST + pieces.filter(p => p.piece.mk2 && (p.state === "free" || p.mk2Missing)).length * (typeof MK2_COST !== "undefined" ? MK2_COST : 15),
             ok: count("blocked") === 0 };
}
// SNAP TO NEST: the placement round this nest with the fewest blocked pieces, then the most already built, then the least shifted from the nest.
function kitFindPlacement(kit, el, nest) {
    let best = null, bs = -Infinity;
    for (const dir of [1, -1]) for (const sx of [0, -1, 1, -2, 2, -3, 3]) {
        const plan = kitPlan(kit, el, nest.x + sx, dir, nest), g = plan.pieces.find(p => p.piece.c === "G");
        if (g && g.tile && g.state === "free" && Math.hypot(g.tile.x - nest.x, g.tile.y - nest.y) > GENERATOR_NEST_RANGE) continue;
        const s = -plan.blocked * 100 + plan.have * 10 - Math.abs(sx) - (dir < 0 ? 5 : 0);
        if (s > bs) { bs = s; best = plan; }
    }
    return best;
}
// The order a kit is built in: the generator first (everything is powered through it), then the connector, the bank in the map's own order, then the rest.
function _kitBuildOrder(plan) {
    const rank = { G: 0, C: 1, B: 2, T: 3, W: 4, S: 5 };
    return plan.pieces.filter(p => p.state === "free").sort((a, b) => (rank[a.piece.c] - rank[b.piece.c]) || (a.piece.dx - b.piece.dx) || (a.piece.dy - b.piece.dy));
}
// Build what is missing, in order, until the shards run out. Returns { built, short (shards still needed), blocked: [reasons], mk2 }.
function kitBuild(plan) {
    const el = plan.el, built = [], reasons = [];
    let short = 0;
    for (const r of _kitBuildOrder(plan)) {
        const t = _kitTile(r.x, r.y), p = r.piece;
        if (!t) continue;
        const why = typeof _bmTileProblem === "function" ? _bmTileProblem(t) : null;
        if (why) { reasons.push(p.c + " at " + r.x + "," + r.y + ": " + why); continue; }
        if (shardCount < PYLON_BUILD_COST) { short += PYLON_BUILD_COST; continue; }
        const before = shardCount;
        if (p.c === "G" || p.c === "C") _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === (p.c === "G" ? GENERATOR_ID : CONNECTOR_ID)), t, null);
        else _executeBuildInstant(ELEMENTS.find(e => e.id === el), t, p.c === "B" ? "battery" : p.c === "T" ? "attack" : waveRole(el));
        if (shardCount < before) built.push(r); else reasons.push(p.c + " at " + r.x + "," + r.y + ": refused");
    }
    if (typeof _cacheAge !== "undefined") _cacheAge = -999;
    if (typeof savePylons === "function") { try { savePylons(); } catch (e) {} }
    // MK II on the pieces that ask for it, where the network already allows it (the tier needs the bank built and counted: otherwise a later pass does it)
    let mk2 = 0, mk2Wait = 0;
    for (const r of plan.pieces) if (r.piece.mk2) { const t = _kitTile(r.x, r.y); if (t && t.pillar && !t.destroyed && (t.mk || 0) < 2) { if (typeof mk2Blocker === "function" && !mk2Blocker(t) && upgradeToMk2(t)) mk2++; else mk2Wait++; } }
    return { built: built.length, short, blocked: reasons, mk2, mk2Wait };
}
// The next piece autoplay (or a crew) should build for this kit at this nest, or null when it is complete or cannot go on.
function kitNextPiece(plan) { const o = _kitBuildOrder(plan); return o.length ? o[0] : null; }
