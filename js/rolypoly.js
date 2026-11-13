// ─────────────────────────────────────────────────────────
//  THE ROLY-POLY — the electric breed's species (docs/ELECTRIC-BREED.md)
// ─────────────────────────────────────────────────────────
// ASKED (the owner, 2026-11-13): "a roly-poly type character that is immune to crushing, immune to slashing, and resistant to piercing. That will be electric type and will
// inhabit the electric domain"; a mech ("take inspiration from Zoids and get rid of the wiry aesthetics"), longer, fewer plates, no eyes and no face, look B (insulator).
// Asked how it works: "Clone potential", "Physical half does 0", "Curls up to defend". Then, of the agent's proposals (numbers, a Crushing bite, the curl's rule, its
// weaknesses, baked sprites): "Build it".
//   its row (immune, weak, resist) and its bite: js/damage.js DMG_RACE.rolypoly, DMG_RACE_BITE
//   its numbers and clone cost: js/species.js SPECIES.rolypoly, CLONE_COSTS
//   THE CURL (here): when a hit leaves it under half its health it curls up into its wheel for ROLYPOLY.curl.frames: it takes ROLYPOLY.curl.taken of every hit and
//     neither moves nor bites; then it uncurls, and cannot curl again for ROLYPOLY.curl.rest after. A stunned or sleeping one does not curl. Its clone curls too.
//   ITS LOOK (here): the baked sheet img/props/rolypoly.png (design/props/models/rolypoly.js): eight facings, four walk frames and the wheel, drawn at the tank's
//     size and scaled by the creature's width; js/bugs3d.js drawBug3D hands it over, so every place that draws a creature draws it.
// Every number here is the agent's, PROVISIONAL (approved with "Build it").
const ROLYPOLY = {
    curl: { under: 0.5, frames: 240, rest: 720, taken: 0.3 },   // under half its health; 4 s curled; 12 s before the next; ×0.3 taken while curled
    tankWidth: 42, res: 2,                                       // the sheet is baked at the tank's width (js/species.js), at twice its size on the screen: drawn at half, a scout and a striker smaller
    gait: 0.8, frames: 4,                                        // its walk: radians of walkCycle a step phase (as js/bugs3d.js's bodies), and the sheet's walk frames
};

function isRolyPoly(a) { return !!a && a.speciesName === "rolypoly"; }
// Its art is ready to draw (true for every other creature): the caches of a creature's picture key on it, so a beetle that stood in is drawn over once the sheet arrives
function rolyArtReady(a) { return !isRolyPoly(a) || (typeof _psImg === "function" && !!_psImg("rolypoly")); }
function rolyCurled(a) { return isRolyPoly(a) && a.curled > 0; }

// After a hit has landed on it (js/helpers.js applyDamage): curl if this hit left it under half its health, it is not curled already, rested, awake and not stunned.
function rolyAfterHit(a) {
    if (!isRolyPoly(a) || a.curled > 0 || (a.curlRest || 0) > 0) return false;
    if (!(a.health > 0) || !(a.maxHealth > 0) || a.health >= a.maxHealth * ROLYPOLY.curl.under) return false;
    if ((a.stunned || 0) > 0 || (a.asleep || 0) > 0) return false;
    a.curled = ROLYPOLY.curl.frames; a.curlRest = ROLYPOLY.curl.frames + ROLYPOLY.curl.rest;
    if (a.attackWindup > 0) { a.attackWindup = 0; a.biteTarget = null; a.attackAnim = 0; }   // a bite it was winding up is cut short, as a stun's (js/combat.js applyStun)
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: a.x, y: a.y, dx: 0, dy: -18, text: "CURLED UP", color: "#f2b13a", size: 11, life: 50, vy: -0.015 });
    return true;
}
// What it takes of a hit: the curl's share while curled.
function rolyTaken(a, amount) { return rolyCurled(a) ? amount * ROLYPOLY.curl.taken : amount; }
// Once a frame (the creature's update, the clone's tick).
function rolyTick(a) {
    if (!isRolyPoly(a)) return;
    if (a.curled > 0) a.curled--;
    if (a.curlRest > 0) a.curlRest--;
}

// ── Its look: a cell of the baked sheet ────────────────────
// Which cell: curled, its wheel; else its facing (the heading in 45-degree steps, 0 the game's +x) and, walking, the walk frame.
function rolyCell(a) {
    let fx = Number.isFinite(a.dirX) ? a.dirX : 1, fy = Number.isFinite(a.dirY) ? a.dirY : 0;
    if (Math.abs(fx) + Math.abs(fy) < 1e-6) { fx = 1; fy = 0; }
    const d = ((Math.round(Math.atan2(fy, fx) / (Math.PI / 4)) % 8) + 8) % 8;
    if (rolyCurled(a)) return "c" + d;
    const moving = a.state !== "attack" && a.state !== "idle" && !a.dead;
    const f = moving ? ((Math.floor((a.walkCycle || 0) * ROLYPOLY.gait / (Math.PI * 2) * ROLYPOLY.frames) % ROLYPOLY.frames) + ROLYPOLY.frames) % ROLYPOLY.frames : 0;
    return "w" + d + "_" + f;
}
// Draw it at its ground point (px, py); returns its height on screen in pixels (for the bars over it), or null when the sheet has not arrived (the caller draws a stand-in).
function drawRolyPoly(a, px, py, g) {
    g = g || ctx;
    if (typeof _psImg !== "function" || typeof PROP_ATLAS === "undefined" || !PROP_ATLAS.rolypoly) return null;
    const img = _psImg("rolypoly"), c = PROP_ATLAS.rolypoly.cells[rolyCell(a)];
    if (!img || !c) return null;
    const w = a.dimensions ? a.dimensions.width : ROLYPOLY.tankWidth, k = w / ROLYPOLY.tankWidth / ROLYPOLY.res, lift = a.leapLift || 0;
    g.save();
    if (a.isNymph) g.globalAlpha = 0.38;
    if (a.hitFlash > 0) g.globalAlpha *= 0.85;
    g.drawImage(img, c.x, c.y, c.w, c.h, px - c.ax * k, py - lift - c.ay * k, c.w * k, c.h * k);
    g.restore();
    return c.ay * k;
}
