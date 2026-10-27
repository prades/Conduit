// ─────────────────────────────────────────────────────────
//  THE TECHNOMANCER'S KIT: the arc gauntlet, its charge, and the grid (docs/TECHNOMANCER.md)
// ─────────────────────────────────────────────────────────
// ASKED (the brief): "Technomancer: hybrid melee and ranged combatant. Uses technological and electrical abilities. Melee combat and ranged electrical attacks should complement one another. Also has a technological
// relationship with the facility's power network and infrastructure."
//   THE PUNCH   the ARC GAUNTLET (WEAPONS.gauntlet, js/weapons.js) is put in hand when the class is chosen, and aimed as every weapon is (js/targeting.js, js/gunfire.js: the dial, a tap on the locked creature, hold
//               to keep going). In reach it PUNCHES: the two beats of the Mutator's lash (js/mutator.js mutatorLash: walked into reach, a wind-up, then the hit), for electric damage. Every punch that lands
//               stores a CHARGE (TECHNO.charge.perHit, up to technoMax()).
//   THE ARC     out of reach, with a charge, it throws an ELECTRIC ARC instead: at once, at the creature (TECHNO.arc.range tiles, in sight), for the punch's damage × TECHNO.arc.mult; it jumps on to TECHNO.arc.chain
//               more creatures, each the nearest within TECHNO.arc.chainRange of the last, for TECHNO.arc.chainPct of that; and a creature it hits while REARING BACK TO BITE (the telegraph, docs/COMBAT.md) loses the
//               bite: it rests TECHNO.arc.stagger frames before it can rear back again (INTERRUPTED over it). It spends one charge. Out of reach with no charge (or out of the arc's range, or round a corner),
//               the gauntlet walks the player in to punch.
//               So each feeds the other: the punches fill the gauntlet; the arc opens a fight from range, cuts a bite short, reaches the creatures behind, and the punch finishes it.
//   THE GRID    the facility's power network charges the gauntlet: in a POWERED room (js/facilitytutorial.js _fpPowered: a room whose relay is online, or every room once the blackout is over) it gains a charge every
//               TECHNO.charge.gridEvery frames; and the arc hits harder for every relay online (TECHNO.arc.perRelay). The relays are the Technomancer's own work (js/stations.js: one power cell, by standing at it).
// Every number is a knob, not a decision (docs/TECHNOMANCER.md, "Tentative").
const TECHNO = {
    charge: { max: 6, perHit: 1, gridEvery: 120 },   // the gauntlet's charges: how many it holds; how many a punch that lands stores; how often (frames) a powered room adds one (0: never)
    // the arc: its damage (× the punch's), how far it reaches (tiles), the rest after it (frames), how many more creatures it jumps to, how far each jump reaches (tiles) and how hard it hits (× the first),
    // the share more it hits for each relay online, how long a bite it cuts short keeps the creature from rearing back again (frames; 0: it cuts nothing), how long it is drawn (frames)
    arc: { mult: 1.3, range: 8, cooldown: 30, chain: 2, chainRange: 2.6, chainPct: 0.6, perRelay: 0.1, stagger: 30, fx: 16 },
};
let technoCharge = 0;   // the gauntlet's charges (saved)
const _tc = { gridAt: 0, gainAt: -1e9, fx: [] };   // gridAt: when the grid last added one (or the count began); gainAt: when a charge was last stored (the pill flashes); fx: the arcs being drawn
function _tcFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _tcMine() { return typeof playerClassKey !== "undefined" && playerClassKey === "technomancer"; }
function _tcSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 60, text, color: col || "#31e8ff", life: 90, vy: -0.25, size: 13 }); }
function technoReset() { technoCharge = 0; _tc.gridAt = _tcFrame(); _tc.gainAt = -1e9; _tc.fx = []; }

// ── the charge ──
function technoMax() { return Math.max(1, Math.round(typeof classStat === "function" ? classStat("technoCharge", TECHNO.charge.max) : TECHNO.charge.max)); }
function technoGain(n) {
    const was = technoCharge; technoCharge = Math.max(0, Math.min(technoMax(), technoCharge + (n | 0)));
    if (technoCharge > was) _tc.gainAt = _tcFrame();
    return technoCharge - was;
}
// is the player standing in a powered room? (outside every room, no)
function technoGridOn() {
    if (typeof _fpRoomKeyAt !== "function" || typeof _fpPowered !== "function") return false;
    const k = _fpRoomKeyAt(player.x, player.y); return !!k && _fpPowered(k);
}
// the relays online (js/stations.js), and what they add to the arc
function technoRelays() { const R = typeof _fp !== "undefined" && _fp && _fp.relays; if (!R) return 0; let n = 0; for (const id of Object.keys(R)) if (R[id] && R[id].online) n++; return n; }
function technoArcDamage() { const base = typeof weaponDamage === "function" ? weaponDamage("gauntlet") : WEAPONS.gauntlet.damage; return Math.round(base * TECHNO.arc.mult * (1 + TECHNO.arc.perRelay * technoRelays()) * 10) / 10; }

// ── the attack (js/input.js firePlayerShot, with the gauntlet in hand): true when a punch or an arc has begun ──
function _tcSight(a) { return typeof facilityLosFrom !== "function" || facilityLosFrom(player.x, player.y, a.x, a.y); }
function technoAttack(foe) {
    if (!foe || foe.dead) return false;
    const d = Math.hypot(foe.x - player.x, foe.y - player.y);
    if (d <= lashReach() || mutatorLashing()) return mutatorLash(foe);   // in reach (or a punch already winding up): the punch
    if (technoCharge >= 1 && d <= TECHNO.arc.range && _tcSight(foe)) return technoArc(foe);
    return mutatorLash(foe);   // walk in to punch
}
// the arc: the first creature, then the nearest within reach of the last, TECHNO.arc.chain times; one charge
function technoArc(foe) {
    if (!foe || foe.dead || technoCharge < 1) return false;
    const f = _tcFrame(), dmg = technoArcDamage(), hit = [foe], pts = [[player.x, player.y], [foe.x, foe.y]];
    technoCharge--;
    _tcZap(foe, dmg);
    let last = foe;
    for (let k = 0; k < TECHNO.arc.chain; k++) {
        let best = null, bd = TECHNO.arc.chainRange;
        for (const a of actors) { if (!a || hit.includes(a) || !isHostileTarget(a)) continue; const dd = Math.hypot(a.x - last.x, a.y - last.y); if (dd <= bd) { bd = dd; best = a; } }
        if (!best) break;
        hit.push(best); pts.push([best.x, best.y]); _tcZap(best, dmg * TECHNO.arc.chainPct); last = best;
    }
    _tc.fx.push({ t0: f, pts, seed: (f * 7919) % 1000 });
    if (typeof tutTally === "function") tutTally("arc");   // (the class's stage counts it: js/tutorial.js)
    if (typeof _mx !== "undefined") { _mx.faceTo = foe; _mx.faceAt = f; }   // (the player turns to it: js/hdsprites.js reads mutatorFacing)
    player.attackCooldown = TECHNO.arc.cooldown;
    if (typeof shake !== "undefined") shake = Math.max(shake, 3);
    return true;
}
// one creature in the arc: the damage, and a bite being wound up is cut short
function _tcZap(a, dmg) {
    const src = { x: player.x, y: player.y, team: "green", element: "electric", isPlayer: true };
    if (typeof applyElementalDamage === "function") applyElementalDamage(a, dmg, src, "electric"); else applyDamage(a, dmg, src, "electric");
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: a.x, y: a.y, color: "#7ff2ff", radius: 0.6, life: 14 });
    if (!a.dead && TECHNO.arc.stagger > 0 && a.attackWindup > 0) {
        a.attackWindup = 0; a.biteTarget = null; a.attackAnim = 0; a.attackCooldown = Math.max(a.attackCooldown || 0, TECHNO.arc.stagger);
        if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: a.x, y: a.y, text: "INTERRUPTED", color: "#7ff2ff", size: 12, life: 46, vy: -0.03 });
    }
}

// ── each step (js/game.js): the grid charges the gauntlet; the arcs fade ──
function technoTick() {
    const f = _tcFrame();
    if (_tc.fx.length) _tc.fx = _tc.fx.filter(z => f - z.t0 < TECHNO.arc.fx);
    if (!_tcMine() || !(TECHNO.charge.gridEvery > 0) || technoCharge >= technoMax() || !technoGridOn()) { _tc.gridAt = f; return; }   // (the count starts when there is a charge to make and power to make it)
    if (f - _tc.gridAt >= TECHNO.charge.gridEvery) { _tc.gridAt = f; technoGain(1); }
}

// ── drawing: the arc, over the scene (js/game.js): a jagged bolt from the player's hand to each creature it hit, in turn, flickering, fading ──
function _tcHash(n) { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return ((n >>> 0) % 1000) / 1000; }
function drawTechnoFx() {
    if (!_tc.fx.length || typeof ctx === "undefined" || typeof canvas === "undefined" || typeof _mxScr !== "function") return;
    const f = _tcFrame();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const z of _tc.fx) {
        const age = f - z.t0, k = Math.max(0, 1 - age / TECHNO.arc.fx), flick = Math.floor(f / 2);
        const P = z.pts.map((p, i) => { const s = _mxScr(p[0], p[1]); return [s[0], s[1] - (i === 0 ? 46 : 30)]; });
        for (let i = 0; i + 1 < P.length; i++) {
            const [x0, y0] = P[i], [x1, y1] = P[i + 1], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, n = Math.max(3, Math.min(9, Math.round(L / 22)));
            const path = [[x0, y0]]; for (let j = 1; j < n; j++) { const t = j / n, off = (_tcHash(z.seed * 131 + i * 17 + j * 7 + flick * 3) - 0.5) * Math.min(26, L * 0.22); path.push([x0 + dx * t + nx * off, y0 + dy * t + ny * off]); } path.push([x1, y1]);
            const line = () => { ctx.beginPath(); ctx.moveTo(path[0][0], path[0][1]); for (let j = 1; j < path.length; j++) ctx.lineTo(path[j][0], path[j][1]); ctx.stroke(); };
            ctx.globalAlpha = 0.5 * k; ctx.strokeStyle = "#31e8ff"; ctx.lineWidth = 9 * k + 2; line();
            ctx.globalAlpha = k; ctx.strokeStyle = "#eaffff"; ctx.lineWidth = 2.5 * k + 1; line();
            if (age < 6) { ctx.globalAlpha = 1 - age / 6; ctx.fillStyle = "#eaffff"; ctx.beginPath(); ctx.arc(x1, y1, 5 + age * 2.5, 0, Math.PI * 2); ctx.fill(); }
        }
    }
    ctx.restore();
}

// ── saving (js/facilitysave.js): the charges in the gauntlet ──
function technoSnapshot() { return technoCharge; }
function technoApply(n) { technoReset(); if (Number.isFinite(n)) technoCharge = Math.max(0, Math.min(technoMax(), n | 0)); }
