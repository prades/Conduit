// ─────────────────────────────────────────────────────────
//  CARD ULTS — each Ultimate in a card battle: its squares, where its card is dropped, its turns (docs/CARD-BATTLES.md §2.64, §13)
// ─────────────────────────────────────────────────────────
// The owner, 2026-11-18, of the Ultimates' page (every Ultimate drawn on the battle's squares from what it does now, as the tile attacks were): "Approve". With it: a lasting Ultimate keeps its own
// length at 2 s a turn and its full damage, a turn's worth at a time (§2.60: "Own length, in turns"); a turn's worth lands as it is played and as each enemy turn begins; you pick the target by
// where you drop the card; FAULTLINE is a line of squares (§2.61); CONTAMINATION NETWORK lays its own pods, a triangle 2 squares from the tile (§2.62); TOXIC PUDDLE is full size from the start;
// the Sundew holds still while it digests. Shields, holds and walls count as statuses do, as the enemies' turn ends (§2.52).
// HOW: an Ultimate's SHAPE (CARD_ULTS, by its form; its sizes the Ultimate's own numbers, read when used) is laid by js/cardshapes.js cardShapeFor as an attack's is (the kinds they share: ring,
// blast, line, fan, one; the rest here: cardUltShape). Played (cardUltFire, from js/cardbattle.js cardBattlePlay), the Ultimate's own code runs with its own damage (js/elements.js
// FORM_ULTIMATES), steered to where the card was dropped as an attack is (cardShapeFoes), and what it leaves is put on the battle's clock: a field that hurts runs 2 s of its own time as it is
// played and as each enemy turn begins, and stands still between (cardUltPaused, asked by js/elements.js for each effect each frame); a hold, a shield or a wall is counted 2 s as each enemy turn
// ends (cardUltTurnEnd). Nothing here changes a number. Out of a battle nothing of this applies.
const CARD_ULTS = {   // kind: its shape; reach: how far its card may be dropped (tiles); r, len: its sizes; lasts: "win" (a field: a turn's worth as played and as each enemy turn begins) or "sta" (a hold, a shield, a wall: counted as the enemies' turn ends); aim: where its card is dropped when its kind does not say
    quillstone:   { kind: "fan", all: () => ULT_QUILLSTORM.count, len: () => ULT_QUILLSTORM.reach },                                  // QUILLSTORM: its quills all round it, each the first enemy on its line
    staticorb:    { kind: "rush", reach: () => ULT_OVERDRIVE.reach, r: () => ULT_OVERDRIVE.radius },                                  // OVERDRIVE: to the enemy; the squares round where it lands
    hammerslug:   { kind: "ring", r: () => ULT_SLAM.radius },                                                                         // SHOCKWAVE SLAM
    seeper:       { kind: "ring", r: () => ULT_UNDERTOW.radius },                                                                     // TOXIC UNDERTOW
    hornshell:    { kind: "cone", reach: () => ULT_WAVE.reach },                                                                      // WAVE MAKER: its three waves' cones, from where it stands and as it moves up
    hovershell:   { kind: "drift", reach: () => ULT_DRIFT.reach, near: true },                                                        // DRIFT SLASH: its oval round the enemy
    thermite:     { kind: "line", len: () => TECH_AB.fault.maxLen, toWall: true, fault: true },                                       // FAULTLINE (§2.61): a line of its path's longest
    thunderhead:  { kind: "ring", r: () => ULT_STORM.radius, lasts: "win" },                                                          // THUNDERSTORM
    rimestar:     { kind: "ring", r: () => ULT_WHITEOUT.radius, lasts: "win" },                                                       // WHITEOUT
    igloo:        { kind: "ring", r: () => ULT_RINK.radius, lasts: "win" },                                                           // ICE RINK
    mimic:        { kind: "ring", r: () => ULT_VORTEX.radius, lasts: "win" },                                                         // SHARD VORTEX
    voidstar:     { kind: "blast", reach: () => ULT_HORIZON.reach, r: () => ULT_HORIZON.radius, lasts: "win" },                       // EVENT HORIZON
    embercowl:    { kind: "rain", reach: () => ULT_REACH, r: () => ULT_METEOR.radius, lasts: "win" },                                 // METEOR RAIN: where its rocks may land
    rotshard:     { kind: "blast", reach: () => ROT_RANGE, r: () => ULT_PUDDLE.radius, lasts: "win" },                                // TOXIC PUDDLE (full size from the start)
    shrub:        { kind: "seed", reach: () => ULT_THICKET.reach, r: () => ULT_THICKET.radius, lasts: "win" },                        // PINK THICKET: round the enemy its seed is slung at
    electroskink: { kind: "blast", reach: () => ULT_CIRCUIT.reach, r: () => ULT_CIRCUIT.radius, lasts: "win" },                       // LIGHTNING CIRCUIT: inside its ring
    blightspider: { kind: "net", reach: () => CARD_ULT.netReach, lasts: "win" },                                                      // CONTAMINATION NETWORK (§2.62): its own pods, its strands' squares
    maw:          { kind: "swallow", r: () => ULT_ZERO.reach, lasts: "sta" },                                                         // ABSOLUTE ZERO: the nearest in its reach
    sundew:       { kind: "one", reach: () => ULT_CONSUME.reach, noBoss: true, lasts: "sta" },                                        // CONSUME
    jellyram:     { kind: "self", lasts: "sta" },                                                                                     // JELLY SHIELDS: no squares
    gooproxy:     { kind: "copies", reach: () => ULT_PROXY.reach, lasts: "sta" },                                                     // PROXY SWARM: its copies' squares
    coralcrab:    { kind: "wall", reach: () => TECH_AB.pillar.reach, lasts: "sta" },                                                  // REEF PILLAR: its wall's squares
};
for (const k in CARD_ULTS) CARD_ULTS[k].ult = true;
const CARD_ULT = {
    netReach: 6,                              // squares from the Spider its network's tile may be (the agent's, approved with the page)
    netPods: [[0, -2], [-2, 1], [2, 1]],      // its three pods round that tile, each 2 squares from it (the same)
};
const _CU_LAST = { thunderstorm: "win", whiteout: "win", icerink: "win", shardvortex: "win", eventhorizon: "win", meteorrain: "win", toxicpuddle: "win", thicket: "win", circuit: "win", toxicnet: "win", abszero: "sta", consume: "sta", jellyshield: "sta" };   // what an Ultimate leaves, and its clock
const _CU_BUSY = { wavemaker: 1, hoverdrift: 1, skinkloop: 1 };   // what an Ultimate is still doing: its turn waits for it
const _CU_NAME = { thunderstorm: "THUNDERSTORM", whiteout: "WHITEOUT", icerink: "ICE RINK", shardvortex: "SHARD VORTEX", eventhorizon: "EVENT HORIZON", meteorrain: "METEOR RAIN", toxicpuddle: "TOXIC PUDDLE", thicket: "PINK THICKET", circuit: "LIGHTNING CIRCUIT", toxicnet: "CONTAMINATION NETWORK" };
function _cuTurn() { return Math.round(60 * CARD_BATTLE.turnSec); }   // a turn of an Ultimate's own time, frames (§2.21)
function cardUltDef(f) { return f && f.evolved && CARD_ULTS[f.evolved] ? CARD_ULTS[f.evolved] : null; }
// where an Ultimate's card is dropped (js/cardshapes.js cardShapeAim asks for the kinds that are only here)
function cardUltAim(def) { const k = def.kind; return k === "rain" || k === "net" ? "tile" : k === "swallow" || k === "self" || k === "copies" ? "any" : "foe"; }

// ── THE SHAPES that only the Ultimates have (js/cardshapes.js cardShapeFor: its own cases first, then these). C: { f, A, foes, E, T, q, V, bad } as there. ──
function cardUltShape(def, S, C) {
    const { f, A, foes, E, T, q, V, bad } = C, floorSees = (o, c) => _csFloor(c[0], c[1]) && _csSees(o[0], o[1], c[0], c[1]);
    switch (def.kind) {
    case "rush": {   // (OVERDRIVE: it lands 0.8 short of the enemy, as its rush does; every enemy on the squares round where it lands)
        if (!_csWalks(A[0], A[1], q[0], q[1])) return bad("NO WAY STRAIGHT TO IT");
        const L = Math.hypot(q[0] - A[0], q[1] - A[1]) || 1, s = Math.max(0, L - 0.8), land = [Math.round(A[0] + (q[0] - A[0]) / L * s), Math.round(A[1] + (q[1] - A[1]) / L * s)];
        S.land = land; S.hit = _csDisc(land[0], land[1], V(def.r), true).filter(c => floorSees(land, c) && !(c[0] === A[0] && c[1] === A[1]));
        S.main = E; S.mask = _csOn(foes, S.hit); if (S.mask.indexOf(E) < 0) S.mask.push(E); S.aim = [E];
        break; }
    case "cone": {   // (WAVE MAKER: a wave from where it stands, then one from each place it moves up to: every square a wave can reach)
        const W = ULT_WAVE, L = Math.hypot(q[0] - A[0], q[1] - A[1]) || 1, ux = (q[0] - A[0]) / L, uy = (q[1] - A[1]) / L, seen = new Set();
        for (let k = 0; k < W.waves; k++) {
            const px = A[0] + ux * W.step * k, py = A[1] + uy * W.step * k;
            for (const c of _csDisc(Math.round(px), Math.round(py), W.len + 1, false)) {
                const dx = c[0] - px, dy = c[1] - py, d = Math.hypot(dx, dy), key = _csK(c[0], c[1]);
                if (seen.has(key) || d < 1e-6 || d > W.len + 1e-6 || (dx * ux + dy * uy) / d < W.cos - 1e-6 || (c[0] === A[0] && c[1] === A[1]) || !_csFloor(c[0], c[1]) || !_csWalks(A[0], A[1], c[0], c[1])) continue;
                seen.add(key); S.hit.push(c);
            }
        }
        S.main = E; S.mask = _csOn(foes, S.hit); if (S.mask.indexOf(E) < 0) S.mask.push(E); S.aim = [E];
        break; }
    case "drift": {   // (DRIFT SLASH: its own oval round the enemy; the squares its blade reaches along it lit; every enemy in its reach glitched, dashed)
        if (!_csWalks(A[0], A[1], q[0], q[1])) return bad("NO WAY STRAIGHT TO IT");
        const D = ULT_DRIFT, path = typeof _ultDriftPath === "function" ? _ultDriftPath({ x: A[0], y: A[1] }, q[0], q[1]) : [[q[0], q[1]]], seen = new Set();
        for (const p of path) for (const c of _csDisc(Math.round(p[0]), Math.round(p[1]), D.cut + 1, false)) { const key = _csK(c[0], c[1]); if (seen.has(key) || Math.hypot(c[0] - p[0], c[1] - p[1]) > D.cut || (c[0] === A[0] && c[1] === A[1]) || !_csFloor(c[0], c[1])) continue; seen.add(key); S.hit.push(c); }
        const near = foes.filter(a => { const s = _csSq(a); return Math.hypot(s[0] - A[0], s[1] - A[1]) <= V(def.reach) + 0.05 && _csWalks(A[0], A[1], s[0], s[1]); });
        S.path = path; S.main = E; S.mask = near.indexOf(E) < 0 ? near.concat([E]) : near; S.aim = [E];
        S.eff = S.mask.map(_csSq).filter(c => !seen.has(_csK(c[0], c[1])));
        break; }
    case "seed": {   // (PINK THICKET: its seed lands on the enemy; the thicket round that square)
        S.hit = _csDisc(q[0], q[1], V(def.r), false).filter(c => floorSees(q, c));
        S.main = E; S.mask = _csOn(foes, S.hit); if (S.mask.indexOf(E) < 0) S.mask.push(E); S.aim = [E];
        break; }
    case "rain": {   // (METEOR RAIN: its rocks land at random on these squares; each blasts its square and those round it, so an enemy a little outside may be struck)
        S.tile = T; S.eff = _csDisc(T[0], T[1], V(def.r), false).filter(c => floorSees(T, c));
        S.mask = _csOn(foes, _csDisc(T[0], T[1], V(def.r) + ULT_METEOR.hit, false)); S.aim = [{ x: T[0], y: T[1], _csTile: true }];
        break; }
    case "net": {   // (CONTAMINATION NETWORK, §2.62: its own pods in a triangle round the tile; the squares of the strands between them)
        const pods = CARD_ULT.netPods.map(o => [T[0] + o[0], T[1] + o[1]]).filter(c => floorSees(T, c)); if (pods.length < 2) return bad("NO ROOM FOR ITS PODS");
        const segs = []; for (let i = 0; i < pods.length; i++) for (let j = i + 1; j < pods.length; j++) segs.push([pods[i], pods[j]]);
        const seen = new Set();
        for (const s of segs) for (const c of _csDisc(Math.round((s[0][0] + s[1][0]) / 2), Math.round((s[0][1] + s[1][1]) / 2), 4, false)) { const key = _csK(c[0], c[1]); if (seen.has(key) || !_csFloor(c[0], c[1]) || _cuSegDist(c, s[0], s[1]) > ULT_NETWORK.touch + 1e-6) continue; seen.add(key); S.hit.push(c); }
        S.tile = T; S.pods = pods; S.segs = segs; S.mask = _csOn(foes, S.hit); S.aim = [];
        break; }
    case "swallow": {   // (ABSOLUTE ZERO: the nearest in its reach that it sees, not a boss, up to its number; its reach dashed)
        S.eff = _csDisc(A[0], A[1], V(def.r), true).filter(c => floorSees(A, c));
        const can = _csOn(foes, S.eff).filter(a => !a.bossName && !a.bossId && !a.isBoss && !a._swallowedBy).sort((a, b) => { const p = _csSq(a), o = _csSq(b); return Math.hypot(p[0] - A[0], p[1] - A[1]) - Math.hypot(o[0] - A[0], o[1] - A[1]); }).slice(0, ULT_ZERO.max);
        if (!can.length) return bad("NO ENEMY IN ITS REACH");
        S.hit = can.map(_csSq); S.mask = can; S.aim = can.slice();
        break; }
    case "self": { S.mask = []; S.aim = foes.slice(); break; }   // (JELLY SHIELDS: on itself and the squad; no squares)
    case "copies": {   // (PROXY SWARM: three copies on free squares next to it, where its own would stand; each one's burst dashed; the enemies in its reach go for them)
        const X = ULT_PROXY, near = foes.filter(a => { const s = _csSq(a); return Math.hypot(s[0] - A[0], s[1] - A[1]) <= V(def.reach) + 0.05; }); if (!near.length) return bad("NO ENEMY IN ITS REACH");
        const taken = _cuTaken(null), spots = [], seen = new Set();
        for (let k = 0; k < X.count; k++) {
            const an = k * Math.PI * 2 / X.count + 0.5, wx = A[0] + Math.cos(an) * 1.2, wy = A[1] + Math.sin(an) * 1.2; let best = null, bd = Infinity;
            for (const c of _csDisc(A[0], A[1], 1.5, true)) { const key = _csK(c[0], c[1]); if (taken.has(key) || seen.has(key) || !_csFloor(c[0], c[1])) continue; const d = Math.hypot(c[0] - wx, c[1] - wy); if (d < bd) { bd = d; best = c; } }
            if (best) { seen.add(_csK(best[0], best[1])); spots.push(best); }
        }
        if (!spots.length) return bad("NO ROOM FOR ITS COPIES");
        S.copies = spots; S.hit = spots.slice(); const lit = new Set(spots.map(c => _csK(c[0], c[1])));
        for (const p of spots) for (const c of _csDisc(p[0], p[1], X.burst, true)) { const key = _csK(c[0], c[1]); if (!lit.has(key) && _csFloor(c[0], c[1]) && !(c[0] === A[0] && c[1] === A[1])) { lit.add(key); S.eff.push(c); } }
        S.mask = near; S.aim = near.slice();
        break; }
    case "wall": {   // (REEF PILLAR: its giant spike on the line to the enemy, a square in front of it as its own rule has it, a lesser one either side: three squares in a row)
        const P = TECH_AB.pillar, D = Math.hypot(q[0] - A[0], q[1] - A[1]) || 1, ux = (q[0] - A[0]) / D, uy = (q[1] - A[1]) / D, k = D >= 2 * P.gap ? D - P.gap : D / 2, mid = [Math.round(A[0] + ux * k), Math.round(A[1] + uy * k)];
        const taken = _cuTaken(null), free = c => _csFloor(c[0], c[1]) && !taken.has(_csK(c[0], c[1]));
        if (!free(mid) || !_csWalks(A[0], A[1], mid[0], mid[1])) return bad("NO ROOM FOR ITS WALL");
        const wall = [mid]; for (const sg of [-1, 1]) { const c = [Math.round(mid[0] - uy * P.spread * sg), Math.round(mid[1] + ux * P.spread * sg)]; if (free(c) && !(c[0] === mid[0] && c[1] === mid[1]) && _csWalks(mid[0], mid[1], c[0], c[1])) wall.push(c); }
        const set = new Set(wall.map(c => _csK(c[0], c[1])));
        S.wall = wall; S.hit = wall.slice(); for (const w of wall) for (const c of _csDisc(w[0], w[1], P.mendReach, true)) { const key = _csK(c[0], c[1]); if (!set.has(key) && _csFloor(c[0], c[1])) { set.add(key); S.eff.push(c); } }
        S.main = E; S.mask = []; S.aim = [E];
        break; }
    default: return null;
    }
    S.maskSet = new Set(S.mask);
    return S;
}
function _cuSegDist(c, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy, t = l2 ? Math.max(0, Math.min(1, ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / l2)) : 0; return Math.hypot(a[0] + dx * t - c[0], a[1] + dy * t - c[1]); }
// the squares fighters stand on (and the battle's decoys and walls), but `skip`'s own
function _cuTaken(skip) {
    const out = new Set(); if (typeof _cb === "undefined") return out;
    for (const [a, s] of _cb.slots) { if (!a || a === skip || a.dead || !(a.health > 0) || _cb.out.has(a)) continue; out.add(_csK(Math.round(s.x), Math.round(s.y))); }
    if (typeof rotDecoys !== "undefined") for (const d of rotDecoys) if (d && !d.dead) out.add(_csK(Math.round(d.x), Math.round(d.y)));
    for (const c of cardUltWalls()) out.add(_csK(c[0], c[1]));
    return out;
}
// the free floor square of the battle's room nearest (x, y)
function _cuFreeNear(x, y, skip) {
    const R = _csRoom(), taken = _cuTaken(skip); let best = null, bd = Infinity;
    for (const c of (R ? R.cells : [])) { if (taken.has(_csK(c[0], c[1]))) continue; const d = Math.hypot(c[0] - x, c[1] - y); if (d < bd) { bd = d; best = c; } }
    return best;
}

// ── PLAYED (js/cardbattle.js cardBattlePlay): the Ultimate's own code, steered to its shape; true when it went off ──
function cardUltFire(f, S, T) {
    const def = S.def, fx0 = new Set(typeof elementEffects !== "undefined" ? elementEffects : []), dc0 = new Set(typeof rotDecoys !== "undefined" ? rotDecoys : []), rf0 = new Set(typeof techReefs !== "undefined" ? techReefs : []), p0 = [f.x, f.y];
    T.fx0 = fx0; let fired = false;
    S.stage = "aim";
    try { fired = def.kind === "net" ? _cuNet(f, S) : def.fault ? _cuFault(f, S) : (typeof followerUltFire === "function" ? followerUltFire(f) : false); }
    finally { S.stage = "area"; }
    if (!fired) return false;
    const now = typeof elementEffects !== "undefined" ? elementEffects.filter(e => !fx0.has(e)) : [];
    if (def.kind === "drift" && typeof applyGlitch === "function") for (const a of S.mask) if (a !== S.main && _cbFoeOk(a)) applyGlitch(a, ULT_DRIFT.glitch);   // (its own code met only the one it was dropped on: the rest of its reach interrupted as it does)
    if (f.evolved === "rotshard") for (const e of now) if (e.type === "toxicpuddle") { e._cbFull = true; e.radius = ULT_PUDDLE.radius; }   // (full size from the start: §2.64)
    if (def.kind === "copies") {   // (each copy on its square; held as a decoy is: through its enemy turns, then it bursts)
        const mine = typeof rotDecoys !== "undefined" ? rotDecoys.filter(d => !dc0.has(d) && d.by === f) : [], n = Math.round(ULT_PROXY.frames / _cuTurn());
        mine.forEach((d, i) => { const c = S.copies[i] || _cuFreeNear(d.x, d.y, null); if (c) { d.x = c[0]; d.y = c[1]; } d._cbHeld = true; d.until += 1e5; });
        for (const e of now) if (e.type === "gooproxy" && mine.indexOf(e.on) >= 0) { e.x = e.on.x; e.y = e.on.y; e._cbHeld = true; e._cbTurns = n; e.life += 1e5; e.maxLife += 1e5; }
    }
    if (def.kind === "wall" && typeof techReefs !== "undefined") for (const O of techReefs) if (!rf0.has(O)) {   // (its spikes on the wall's squares; the battle counts its turns and does its mending: cardUltTurnEnd)
        O.parts = S.wall.map((c, i) => ({ x: c[0], y: c[1], r: (O.parts[i] || O.parts[0]).r })); O.x = O.parts[0].x; O.y = O.parts[0].y;
        O._cbTurns = Math.round(TECH_AB.pillar.life / _cuTurn()); O._cbHeld = true; O.until = 1e12;
    }
    if (def.kind === "swallow" || f.evolved === "sundew") for (const a of _cb.foes) if (a && a._swallowedBy === f) _cb.slots.delete(a);   // (inside it: its square is free till it is let go)
    if (def.kind === "self") for (const m of _cbSquad().concat([f])) if (m && m.jellyShield && m.jellyShield.by === f && !m.jellyShield._cbTurns) { m.jellyShield._cbTurns = Math.round(ULT_JELLY.frames / _cuTurn()); m.jellyShield.until = 1e12; }
    if (Math.hypot(f.x - p0[0], f.y - p0[1]) > 0.5) { T.anc = [f.x, f.y]; T.px = f.x; T.py = f.y; }   // (carried as it went off: held where it was carried, its square after, as a dash's: §2.57)
    _cuMark(T);
    return true;
}
// FAULTLINE in a battle (§2.61): its path is its line of squares, from its square to the line's end; its own run along it (js/techabilities.js)
function _cuFault(f, S) {
    if (typeof techFaultPath !== "function" || typeof techFaultlineAt !== "function" || !S.hit.length) return false;
    const end = S.hit[S.hit.length - 1], P = techFaultPath(f, [{ x: S.A[0], y: S.A[1] }, { x: end[0], y: end[1] }]); if (!P.ok) { S.why = P.why; return false; }
    return !!techFaultlineAt(f, P.pts).ok;
}
// CONTAMINATION NETWORK in a battle (§2.62): its own pods, the strands' ends, and the network between them at once; the pods are no more than that and go with it
function _cuNet(f, S) {
    if (!(f.ultimateCharge >= 100) || typeof spawnElementEffect !== "function") return false;
    const N = ULT_NETWORK, cx = S.pods.reduce((s, p) => s + p[0], 0) / S.pods.length, cy = S.pods.reduce((s, p) => s + p[1], 0) / S.pods.length;
    f.ultimateCharge = 0;
    spawnElementEffect({ type: "toxicnet", x: cx, y: cy, segs: S.segs, pods: S.pods, by: f, bite: (f.power || 10) * N.mult, life: N.frames, maxLife: N.frames, element: "toxic" });
    if (typeof _ultSay === "function") _ultSay(f, "CONTAMINATION NETWORK", "#99ff88");
    return true;
}
// what an Ultimate has left since its card was played is put on the battle's clock: a field's first turn's worth runs now
function _cuMark(T) {
    if (typeof elementEffects === "undefined" || !T.fx0) return;
    for (const e of elementEffects) { if (e._cbUlt || T.fx0.has(e) || !_CU_LAST[e.type] || !(e.life > 0)) continue; e._cbUlt = _CU_LAST[e.type]; e._cbBy = T.f; if (e._cbUlt === "win" && T.shape && !e.on) e._cbSq = T.shape.hit.length ? T.shape.hit : T.shape.eff; if (e._cbUlt === "win") { e._cbLive = _cuTurn(); if (!T.ultAt) T.ultAt = _cbF(); } }
}
// is the Ultimate's turn over? (js/cardbattle.js _cbTurnTick, each frame of it): not while it is still moving, nor while its field's first turn's worth runs
function cardUltDone(T, el) {
    const f = T.f, def = T.shape && T.shape.def; if (!def || !def.ult) return el >= CARD_BATTLE.ultHold;
    _cuMark(T);
    if (f._fault) return false;
    if (typeof elementEffects !== "undefined" && elementEffects.some(e => _CU_BUSY[e.type] && e.on === f && e.life > 0)) return false;
    if (typeof followerProjectiles !== "undefined" && followerProjectiles.some(p => p && p.source === f)) return false;
    if (def.lasts === "win") return T.ultAt ? !elementEffects.some(e => e._cbUlt === "win" && e._cbBy === f && e._cbLive > 0 && e.life > 0) : el >= CARD_BATTLE.ultHold * 2;
    return el >= CARD_BATTLE.ultHold;
}

// ── THE BATTLE'S CLOCK on what an Ultimate leaves ──
// js/elements.js, each effect each frame: does it stand still this frame? A field runs only its turn's worth (as it is played; as an enemy turn begins: cardUltWindow); a hold or a shield only
// when the battle counts it (cardUltTurnEnd). The battle over, it runs on as ever.
function cardUltPaused(e) {
    if (typeof _cb === "undefined" || _cb.phase !== "on") { e._cbUlt = null; return false; }
    if (e.type === "meteorrain" && e.rocks && e.rocks.every(r => r.hit)) { e._cbUlt = null; e._cbLive = 0; return false; }   // (METEOR RAIN's last rock down: what is left is its craters cooling, no turn's worth; it fades on by itself)
    if (e._cbUlt === "win") { if (e._cbLive > 0) { e._cbLive--; return false; } return true; }
    return !e._cbStep;
}
// js/elements.js, at the top of each effect's step: true, it stands still this frame; and whose step runs now is kept, so a field's own look for enemies finds the battle's (cardShapeFoes)
let _cuNow = null;
function cardUltGate(e) { _cuNow = null; if (!e || !e._cbUlt) return false; if (cardUltPaused(e)) return true; if (e._cbUlt) _cuNow = e; return false; }
function cardUltNow() { return _cuNow; }
// the enemies' turn begins (js/cardbattle.js _cbFoesTurn): every field's next turn's worth; true when one runs (the enemies wait for it)
function cardUltWindow() {
    let any = false; if (typeof elementEffects === "undefined") return false;
    for (const e of elementEffects) if (e._cbUlt === "win" && e.life > 0) { e._cbLive = _cuTurn(); any = true; }
    return any;
}
function cardUltLive() { return typeof elementEffects !== "undefined" && elementEffects.some(e => e._cbUlt === "win" && e._cbLive > 0 && e.life > 0); }
function cardUltBanner() { const e = typeof elementEffects !== "undefined" ? elementEffects.find(x => x._cbUlt === "win" && x._cbLive > 0 && x.life > 0) : null; return e ? (_CU_NAME[e.type] || "ULTIMATE") + " · " + Math.max(1, Math.ceil(e.life / _cuTurn())) + (Math.ceil(e.life / _cuTurn()) > 1 ? " TURNS LEFT" : " TURN LEFT") : "ULTIMATE"; }
// the enemies' turn is over (js/cardbattle.js _cbYourTurn): a turn on every hold, shield, copy and wall
function cardUltTurnEnd() {
    const N = _cuTurn();
    if (typeof elementEffects !== "undefined" && typeof elementEffectStep === "function") {
        const gone = new Set();
        for (const e of elementEffects.slice()) { if (e._cbUlt !== "sta") continue; e._cbStep = true; let alive = true; for (let i = 0; i < N && alive; i++) alive = elementEffectStep(e); e._cbStep = false; if (!alive) gone.add(e); }
        if (gone.size) elementEffects = elementEffects.filter(e => !gone.has(e));
    }
    for (const m of _cbSquad()) { const J = m && m.jellyShield; if (J && J._cbTurns > 0 && --J._cbTurns <= 0) J.until = 0; }   // (a jelly shield's turns: its last over, it is gone)
    if (typeof techReefs !== "undefined") for (const O of techReefs) {   // (REEF PILLAR: a turn's mending of yours near it, then a turn less to stand)
        if (!(O._cbTurns > 0)) continue;
        if (typeof healUnit === "function" && typeof followers !== "undefined") for (const a of followers) { if (!a || a.dead || a.team !== "green" || !(a.maxHealth > 0) || !(a.health < a.maxHealth)) continue; if (O.parts.some(c => Math.hypot(a.x - c.x, a.y - c.y) <= c.r + O.mendReach && _csSees(c.x, c.y, a.x, a.y))) healUnit(a, a.maxHealth * O.mend * (N / O.every), O.by); }
        if (--O._cbTurns <= 0) O.until = typeof _techFrame === "function" ? _techFrame() : 0;
    }
    cardUltGate(null); _cuResquare();
}
// one let go by what held it (spat out, set down) takes the free square nearest where it was put
function _cuResquare() {
    for (const a of _cb.foes) { if (!a || a.dead || !(a.health > 0) || a._swallowedBy || _cb.slots.has(a)) continue; const c = _cuFreeNear(a.x, a.y, a); if (c) { _cb.slots.set(a, { x: c[0], y: c[1] }); a.x = c[0]; a.y = c[1]; if (Number.isFinite(a.visualX)) { a.visualX = a.x; a.visualY = a.y; } } }
}
// an enemy held inside one of yours (ABSOLUTE ZERO, CONSUME): still in the battle, though it cannot be struck nor act
function cardUltHeldFoe(a) { return !!a && !a.dead && a.health > 0 && !!a._swallowedBy && typeof _cbMine === "function" && _cbMine(a._swallowedBy); }
// the squares a battle's wall stands on (REEF PILLAR's spikes): nobody walks through them (js/cardbattle.js _cbGrid)
function cardUltWalls() {
    const out = []; if (typeof techReefs === "undefined") return out;
    for (const O of techReefs) if (O._cbTurns > 0) for (const c of O.parts) out.push([Math.round(c.x), Math.round(c.y)]);
    return out;
}
// the battle is over (js/cardbattle.js cardBattleEnd, cardBattleReset): its fields close, its holds let go, its shields, copies and walls go
function cardUltEnd() {
    const f0 = typeof frame !== "undefined" ? frame : 0;
    if (typeof elementEffects !== "undefined") for (const e of elementEffects) { if (!e._cbUlt) continue; const win = e._cbUlt === "win"; e._cbUlt = null; e._cbLive = 0; e.life = Math.min(e.life, win ? 24 : 1); }
    if (typeof followers !== "undefined") for (const m of followers) if (m && m.jellyShield && m.jellyShield._cbTurns !== undefined) m.jellyShield.until = Math.min(m.jellyShield.until, f0);
    if (typeof techReefs !== "undefined") for (const O of techReefs) if (O._cbHeld) { O._cbTurns = 0; O._cbHeld = false; O.until = typeof _techFrame === "function" ? _techFrame() : 0; }
}
// THE FIELD'S SQUARES, FAINT (the owner, 2026-11-20: "you can have the tiles faint right now", till the fields' own animation is in the battle's view; §2.65): the squares of each
// field an Ultimate left stay lit, faintly, in its follower's colour, while it lasts; a wall's too. One that moves with its follower is laid again when it has moved. The look the agent's.
// the fields a battle's Ultimates left, for the 3D view to draw (view3d/gamemap.js battleFields, view3d/fields.js): the same list each frame, refilled
const _cuFields = [];
function cardUltFields() { _cuFields.length = 0; if (typeof _cb === "undefined" || _cb.phase !== "on" || typeof elementEffects === "undefined") return _cuFields; for (const e of elementEffects) if (e._cbUlt === "win" && e.life > 0 && cardUltShown(e)) _cuFields.push(e); return _cuFields; }
// WHEN A FIELD IS SEEN (the owner, 2026-11-20: "The ultimate animations should only appear when they're cast, and then they should go away for the next creature's turn [...] The battlefield
// should be clear, unless it's the creature who casts the ultimate's turn"): in its caster's turn (as it is cast; your round come to that follower again); and, the agent's reading, while its
// own turn's worth strikes as the enemies' turn begins (its numbers would rise from nothing). At every other time the floor is clear of it, its faint squares too.
function cardUltShown(e) {
    const T = typeof _cb !== "undefined" && _cb.phase === "on" ? _cb.turn : null; if (!T || !e) return false;
    if (T.who === "act") return T.f === e._cbBy;
    if (T.who === "you") return _cbCurrent() === e._cbBy;
    return T.who === "foe" && !!T.field && e._cbLive > 0;
}
function cardUltSquares(e) {
    if (e.on) { const k = Math.round(e.x) + "," + Math.round(e.y); if (e._cbSqK !== k) { e._cbSqK = k; e._cbSq = _csDisc(Math.round(e.x), Math.round(e.y), e.radius || 0, true).filter(c => _csFloor(c[0], c[1]) && _csSees(Math.round(e.x), Math.round(e.y), c[0], c[1])); } }
    return e._cbSq || null;
}
function cardUltDraw(V) {
    if (typeof _cb === "undefined" || _cb.phase !== "on" || typeof ctx === "undefined" || typeof elementEffects === "undefined") return;
    const quad = (x, y) => { const h = 0.44; ctx.beginPath(); for (let i = 0; i < 4; i++) { const q = V.screenNow(x + (i === 0 || i === 3 ? -h : h), y + (i < 2 ? -h : h), 0); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } ctx.closePath(); };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineWidth = 1.5;
    for (const e of elementEffects) { if (e._cbUlt !== "win" || !(e.life > 0) || !cardUltShown(e)) continue; const sq = cardUltSquares(e); if (!sq) continue; const col = typeof _cbCol === "function" && e._cbBy ? _cbCol(e._cbBy) : "#19e6c1";
        ctx.fillStyle = col; ctx.strokeStyle = col; for (const c of sq) { quad(c[0], c[1]); ctx.globalAlpha = 0.14; ctx.fill(); ctx.globalAlpha = 0.4; ctx.stroke(); } }
    const W = cardUltWalls(); if (W.length) { ctx.fillStyle = ctx.strokeStyle = "#ff8fc8"; for (const c of W) { quad(c[0], c[1]); ctx.globalAlpha = 0.3; ctx.fill(); ctx.globalAlpha = 0.7; ctx.stroke(); } }
    ctx.restore();
}
// METEOR RAIN's middle in a battle (js/elements.js asks): the tile its card was dropped on, while its card's turn is on
function cardUltPoint(f) {
    const T = typeof _cb !== "undefined" && _cb.phase === "on" ? _cb.turn : null, S = T && T.who === "act" && T.f === f && T.shape ? T.shape : null;
    return S && S.def.ult && S.tile ? { x: S.tile[0], y: S.tile[1] } : null;
}
// an enemy's walk onto a square (js/cardbattle.js _cbWalkTick): across a strand of a network of yours, it is bitten a turn's worth and poisoned, once a walk (§13)
function cardUltStepOn(T, u, c) {
    if (T.netBit || typeof elementEffects === "undefined" || _cb.foes.indexOf(u) < 0) return;
    for (const e of elementEffects) {
        if (e._cbUlt !== "win" || e.type !== "toxicnet" || !(e.life > 0) || !e.segs.some(s => _cuSegDist(c, s[0], s[1]) <= ULT_NETWORK.touch + 1e-6)) continue;
        T.netBit = true; const n = Math.round(_cuTurn() / ULT_NETWORK.tick);
        for (let i = 0; i < n && !u.dead; i++) applyDamage(u, e.bite, e.by || null, "toxic", false, false, DMG_HIT_SPECIAL);
        if (!u.dead && typeof applyWeaken === "function") applyWeaken(u, ULT_NETWORK.poison);
        return;
    }
}
// a follower of yours on a live ICE RINK of the battle walks further (js/cardbattle.js _cbTiles: its pace times this)
function cardUltPace(u) {
    if (!u || typeof elementEffects === "undefined" || typeof _cb === "undefined" || _cb.phase !== "on" || !(u.isFollower === true && u.team === "green")) return 1;
    const s = _cbSq(u); let k = 1;
    for (const e of elementEffects) if (e._cbUlt === "win" && e.type === "icerink" && e.life > 0 && Math.hypot(s[0] - e.x, s[1] - e.y) <= e.radius) k = Math.max(k, ULT_RINK.fast);
    return k;
}

// ── THE WORDS on an Ultimate's card in a battle (js/cardshapes.js cardShapeSays): its squares and what a turn of it does, short enough for the card's four lines ──
function _cuTurns(frames) { const n = Math.max(1, Math.ceil(frames / _cuTurn() - 1e-9)); return n + (n === 1 ? " turn" : " turns"); }
function _cuSq(tiles) { const n = Math.max(1, Math.ceil(tiles - 1e-6)); return n + (n === 1 ? " square" : " squares"); }
const CARD_ULT_SAYS = {
    quillstone:   () => ULT_QUILLSTORM.count + " quills all round it, " + ULT_QUILLSTORM.reach + " squares long · each the first enemy on its line",
    staticorb:    () => "Rushes to an enemy within " + ULT_OVERDRIVE.reach + " · the " + _csSquares(ULT_OVERDRIVE.radius, true) + " squares round it pushed " + _cuSq(ULT_OVERDRIVE.knock),
    hammerslug:   () => "The " + _csSquares(ULT_SLAM.radius, true) + " squares round it · thrown " + _cuSq(ULT_SLAM.knock) + ", stunned " + _cuTurns(ULT_SLAM.stun),
    seeper:       () => "The " + _csSquares(ULT_UNDERTOW.radius, true) + " squares round it · thrown " + _cuSq(ULT_UNDERTOW.thrown) + ", weakened " + _cuTurns(ULT_UNDERTOW.weak),
    hornshell:    () => ULT_WAVE.waves + " waves at an enemy within " + ULT_WAVE.reach + ", " + ULT_WAVE.len + " squares deep · each throws " + _cuSq(ULT_WAVE.knock) + " back; it moves up",
    hovershell:   () => "An oval round an enemy within " + ULT_DRIFT.reach + " · slashed; all in reach glitched; squad faster " + _cuTurns(ULT_DRIFT.frames),
    thermite:     () => "A line of " + TECH_AB.fault.maxLen + " squares through an enemy · each on it spiked once; it comes up at its end",
    thunderhead:  () => "The " + _csSquares(ULT_STORM.radius, true) + " squares round it, moving with it · " + Math.round(_cuTurn() / ULT_STORM.tick) + " bolts a turn, " + _cuTurns(ULT_STORM.frames),
    rimestar:     () => "The " + _csSquares(ULT_WHITEOUT.radius, true) + " squares round it, moving with it · bitten and slowed, " + _cuTurns(ULT_WHITEOUT.frames),
    igloo:        () => "The " + _csSquares(ULT_RINK.radius, true) + " squares round it · enemies bitten and slowed, yours faster, " + _cuTurns(ULT_RINK.frames),
    mimic:        () => "The " + _csSquares(ULT_VORTEX.radius, true) + " squares round it · pulled in and bitten, " + _cuTurns(ULT_VORTEX.frames) + "; heals it",
    voidstar:     () => "Every square within " + ULT_HORIZON.radius + " of a tile in reach · dragged in and crushed, " + _cuTurns(ULT_HORIZON.frames),
    embercowl:    () => ULT_METEOR.count + " rocks on the " + _csSquares(ULT_METEOR.radius, false) + " squares round a tile · each a 3×3 blast; burning " + _cuTurns(ULT_METEOR.burn),
    rotshard:     () => "The " + _csSquares(ULT_PUDDLE.radius, false) + " squares round a tile in reach · shards and poison, " + _cuTurns(ULT_PUDDLE.frames),
    shrub:        () => "The " + _csSquares(ULT_THICKET.radius, false) + " squares round an enemy · held and bitten " + _cuTurns(ULT_THICKET.frames) + "; heals yours in it",
    electroskink: () => "A ring round " + _csSquares(ULT_CIRCUIT.radius, false) + " squares · shocked inside, " + _cuTurns(ULT_CIRCUIT.frames) + "; crossing it stuns " + _cuTurns(ULT_CIRCUIT.stun),
    blightspider: () => "3 pods round a tile, strands between · on a strand: bitten, poisoned " + _cuTurns(ULT_NETWORK.poison) + "; " + _cuTurns(ULT_NETWORK.frames),
    maw:          () => "Swallows the " + ULT_ZERO.max + " nearest within " + ULT_ZERO.reach + " squares (not a boss) · out of the fight " + _cuTurns(ULT_ZERO.frames),
    sundew:       () => "Swallows an enemy within " + ULT_CONSUME.reach + " (not a boss) · " + Math.floor(ULT_CONSUME.frames / ULT_CONSUME.tick) + " bites over " + _cuTurns(ULT_CONSUME.frames) + "; it holds still",
    jellyram:     () => "Shields on it and 2 of the squad · each soaks " + Math.round(ULT_JELLY.soak * 100) + "% health, " + _cuTurns(ULT_JELLY.frames) + "; attackers thrown back",
    gooproxy:     () => ULT_PROXY.count + " copies next to it · enemies within " + ULT_PROXY.reach + " go for them, " + _cuTurns(ULT_PROXY.frames) + "; then each bursts",
    coralcrab:    () => "A wall of 3 squares before an enemy · none pass, " + _cuTurns(TECH_AB.pillar.life) + "; mends yours near it",
};
function cardUltSays(f) { const fn = f && f.evolved ? CARD_ULT_SAYS[f.evolved] : null; try { return fn ? fn(f) : null; } catch (e) { return null; } }
