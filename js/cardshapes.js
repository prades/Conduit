// ─────────────────────────────────────────────────────────
//  CARD SHAPES — the squares each attack card takes in a card battle (docs/CARD-BATTLES.md §2.48)
// ─────────────────────────────────────────────────────────
// The owner, 2026-11-17: "We should have some cards that are single target and some cards that are tile target AoE attacks", then "Like some may only strike two, and some might only strike in
// zigzag formations, like our electroskick"; of what was offered, "The shape decides who's hit" (each card a fixed pattern of squares, lit on the floor while it is dragged; exactly the enemies on
// those squares take the attack's own damage and effects, no number changed) and "From what each attack does now"; of the page that drew every card's shape from the code: "Approve and push the
// new tile attack" (2026-11-18; with it the page's suggestions: an area that stays lasts 2 enemy turns, hitting what stands in it at the start of each; the sizes as drawn; ECHO PULSE's 4; the
// draws, SWEET SCENT, SHELL GUARD and ROTTEN DECOY, kept as their cards' own effects).
// HOW: a card's SHAPE (CARD_SHAPES, by its attack; the sizes are the attacks' own reach and radius, read when used) is laid on the battle's squares from where the follower stands and where the card
// is let go (cardShapeFor): on an enemy (one target, a chain, a path, a fan, a swap, a splash), on a floor square (a blast, the decoy) or anywhere (a ring round itself, the moves needing no target).
// Dragged, its squares light up (cardShapeDraw). Played, the attack goes off at once (cardShapeFire, from js/cardbattle.js cardBattlePlay): the move's own code with its own damage and effects, but
// what it can touch is exactly its shape's enemies (cardShapeFoes, asked by js/evolution.js _evoFoes; cardShapeSees, _evoSees; cardShapeSpared, js/helpers.js applyDamage; a shot's own target,
// cardShapeShot, js/clone.js spawnFollowerProjectile). Nothing here changes a number. Out of a battle, and for the Ultimates (their shapes are the next page), nothing of this applies.
const CARD_SHAPE_STAY = 2;   // enemy turns an area that stays lasts in a battle, hitting what stands in it at the start of each (the page's suggestion, approved with it)
const CARD_SHAPES = {   // kind: one | chain | line | zigzag | fan | swap | blast | decoy | ring; r, reach, hop, len, n: the attack's own numbers (functions, so a change there follows)
    _basic:          { kind: "one" },                                                       // every follower's everyday hit (FIREBALL, SEED SHOT, NECTAR STING and BURROW STRIKE too)
    _chainLightning: { kind: "chain", hop: () => CHAIN_HOP, n: Infinity },                   // the Thunderhead's everyday shot: on through every enemy within CHAIN_HOP of the last
    _corrodeShot:    { kind: "one", r: () => ROT_SPLASH_R },                                  // the Rotshard's everyday shot: the target, and its armour eaten less round it
    bash:            { kind: "one" },
    venom_bite:      { kind: "one" },
    rift_impale:     { kind: "one" },
    corrode_shot:    { kind: "one", r: () => ROT_SPLASH_R },
    chomp:           { kind: "one", r: () => MAW_SLOW_R },                                    // the target frozen; the squares round it slowed (effect only)
    static_rush:     { kind: "chain", hop: () => MANTA_HOP, n: () => MANTA_CHAIN },           // SONIC ROLL
    shock_zap:       { kind: "chain", hop: () => ZAP_ARC, n: 1, restEff: true },              // (the second only glitched, not hurt)
    capacitor_discharge: { kind: "chain", self: true, reach: () => CAP_REACH, hop: () => CAP_HOP, n: () => CAP_MAX },   // (a full release in a battle: cardShapeFire)
    zigzag_dash:     { kind: "zigzag", len: 4 },
    ember_slash:     { kind: "line", len: () => EMBER_RANGE },
    skate_charge:    { kind: "line", len: () => SKATE_RANGE },
    blade_roll:      { kind: "line", len: () => ROLL_RANGE },
    icicle_volley:   { kind: "fan", angles: [-15, 0, 15], len: () => ICICLE_RANGE },           // (its icicles ICICLE_FAN, 0.26 rad, apart)
    quill_burst:     { kind: "fan", angles: [-20, -10, 0, 10, 20], len: () => QUILL_RANGE },   // (QUILL_FAN, 40°, edge to edge)
    phase_swap:      { kind: "swap" },
    maelstrom:       { kind: "blast", r: () => MAEL_RADIUS, stays: true },
    hexfire:         { kind: "blast", r: () => HALO_RADIUS, stays: true },
    magma_vent:      { kind: "blast", r: () => MAGMA_RADIUS, stays: true },
    static_vortex:   { kind: "blast", r: () => VORTEX_RADIUS, stays: true },
    rotten_decoy:    { kind: "decoy", r: () => DECOY_MIST, stays: true },
    stake_ring:      { kind: "ring", r: () => STAKE_RADIUS },
    toxic_stomp:     { kind: "ring", r: () => STOMP_RADIUS },
    wobble_slam:     { kind: "ring", r: () => WOBBLE_RADIUS },
    briar_sweep:     { kind: "ring", r: () => BRIAR_RADIUS },
    gravity_slam:    { kind: "ring", r: () => MIMIC_RADIUS },
    eruption:        { kind: "ring", r: () => CALDERA_RADIUS },
    echo_pulse:      { kind: "ring", r: () => ECHO_RADIUS },
    seedfall:        { kind: "ring", r: () => BUD_RADIUS, heal: true },                       // heals your side round it; hurts no enemy
    sweet_scent:     { kind: "ring", r: () => SCENT_RADIUS, eff: true, alt: f => (f._nectar || 0) >= 100 ? { r: SCENT_HEAL_R, heal: true } : null },   // a draw; its stockpile full, a heal
    shell_guard:     { kind: "ring", r: () => GUARD_LURE, eff: true },                        // a draw (it braces: half damage)
    // the retired forms' (no form has them now: drawn the same way in case one comes back)
    petal_blaze:     { kind: "ring", r: () => BLOOM_RADIUS },
    arc_volley:      { kind: "chain", hop: () => REAVER_HOP, n: () => REAVER_CHAIN },
    singularity_shot: { kind: "blast", r: () => SERPENT_PULL_R },
    pinball:         { kind: "chain", hop: () => PIN_HOP, n: Infinity },
};
const _CS_STAYS = { maelstrom: e => maelstromBeat(e), hexfire: e => fieldBite(e, "fire"), magmavent: e => fieldBite(e, "fire"), staticVortex: e => fieldBite(e, "electric"), rotdecoy: e => { if (e.on && !e.on.dead) rotDecoyMist(e.on); } };   // (each area's own bite)
const _cs = { of: null, keys: null, cells: [] };
const _csK = (x, y) => x + "," + y;
function _csV(v, f) { return typeof v === "function" ? v(f) : v; }
// the battle room's floor squares (made once a line-up)
function _csRoom() {
    const L = typeof _cb !== "undefined" ? _cb.lay : null; if (!L) return null;
    if (_cs.of !== L) { _cs.of = L; _cs.cells = L.room && typeof partyRoomCells === "function" ? partyRoomCells(L.room) || [] : []; _cs.keys = _cs.cells.length ? new Set(_cs.cells.map(c => _csK(c[0], c[1]))) : null; }
    return _cs;
}
function _csFloor(x, y) { const R = _csRoom(); return R && R.keys ? R.keys.has(_csK(x, y)) : true; }
function _csSees(x0, y0, x1, y1) { return typeof facilitySeesFrom !== "function" || facilitySeesFrom(x0, y0, x1, y1); }
function _csWalks(x0, y0, x1, y1) { return typeof facilityLosFrom !== "function" || facilityLosFrom(x0, y0, x1, y1); }
function _csSq(a) { const s = _cbSq(a); return [Math.round(s[0]), Math.round(s[1])]; }
function _csDisc(cx, cy, r, skip) { const out = [], R = Math.ceil(r); for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) { if (skip && !dx && !dy) continue; if (Math.hypot(dx, dy) <= r + 1e-6) out.push([cx + dx, cy + dy]); } return out; }
// the squares along a line from a square, `len` tiles, while `ok` holds (its own square left out)
function _csRay(ax, ay, ang, len, ok) {
    const out = [], seen = new Set();
    for (let s = 0.5; s <= len + 0.01; s += 0.25) { const x = Math.round(ax + Math.cos(ang) * s), y = Math.round(ay + Math.sin(ang) * s), k = _csK(x, y); if ((x === ax && y === ay) || seen.has(k)) continue; if (ok && !ok(x, y)) break; seen.add(k); out.push([x, y]); }
    return out;
}
// of `list`, the enemies standing on these squares (a huge body: on any square it covers)
function _csOn(list, tiles) {
    const set = new Set(tiles.map(c => _csK(c[0], c[1])));
    return list.filter(a => { const s = _csSq(a); if (set.has(_csK(s[0], s[1]))) return true; const R = a.bodyR || 0; return R > 0.6 && tiles.some(c => Math.hypot(c[0] - s[0], c[1] - s[1]) <= R + 0.2); });
}
function _csNearest(list, q) { let best = null, bd = Infinity; for (const a of list) { const s = _csSq(a), d = Math.hypot(s[0] - q[0], s[1] - q[1]); if (d < bd - 1e-9) { bd = d; best = a; } } return best; }
// a card's shape (null: an Ultimate's, or nothing to lay it on)
function cardShapeDef(f, kind, id) {
    if (!f || kind === "ult") return null;
    if (kind === "basic") { const d = f.evolved && typeof evolvedDef === "function" ? evolvedDef(f) : null, shot = d && d.shot; return shot === "CHAIN LIGHTNING" ? CARD_SHAPES._chainLightning : shot === "CORRODE SHOT" ? CARD_SHAPES._corrodeShot : CARD_SHAPES._basic; }
    return CARD_SHAPES[id] || CARD_SHAPES._basic;
}
// where it is let go: "foe" (on an enemy), "tile" (on a floor square), "any" (anywhere)
function cardShapeAim(def) { return !def ? "foe" : def.kind === "blast" || def.kind === "decoy" ? "tile" : def.kind === "ring" || def.self ? "any" : "foe"; }
// THE SHAPE of `f`'s card aimed at `aim` (an enemy of the battle; a floor square { x, y }; nothing): its squares (`hit`, lit; `eff`, effect only), the enemies it takes in (`mask`), the one it is
// aimed at (`main`), what the move's own first look finds (`aim`: its target, the square of a blast as a point, or for a ring the enemies in it), a fan's shots (`rays`), a blast's square (`tile`).
// `ok` false with `why` when it cannot be played so; null when the card has no shape here.
function cardShapeFor(f, kind, id, aim) {
    const def = cardShapeDef(f, kind, id); if (!def || typeof _cb === "undefined" || !_cb.lay) return null;
    const A = _csSq(f), foes = _cb.foes.filter(_cbFoeOk), V = v => _csV(v, f), aimK = cardShapeAim(def);
    const S = { def, kind, id, A, hit: [], eff: [], links: [], rays: null, main: null, mask: [], aim: [], tile: null, ok: true, why: "", stage: "area" };
    const bad = why => { S.ok = false; S.why = why; S.maskSet = new Set(S.mask); return S; };
    const E = aimK === "foe" && aim && foes.indexOf(aim) >= 0 ? aim : null;
    const T = aimK === "tile" && aim && Number.isFinite(aim.x) && Number.isFinite(aim.y) ? [Math.round(aim.x), Math.round(aim.y)] : null;
    if (aimK === "foe" && !E) return bad("NO TARGET");
    if (aimK === "tile" && !T) return bad("NO SQUARE");
    const q = E ? _csSq(E) : null;
    switch (def.kind) {
    case "one": {
        S.hit = [q]; S.main = E; S.mask = [E]; S.aim = [E];
        if (def.r) { S.eff = _csDisc(q[0], q[1], V(def.r), true).filter(c => !(c[0] === A[0] && c[1] === A[1]) && _csFloor(c[0], c[1]) && _csSees(q[0], q[1], c[0], c[1])); S.mask = [E].concat(_csOn(foes.filter(a => a !== E), S.eff)); }
        break; }
    case "chain": {
        let first = E;
        if (def.self) { const R = V(def.reach); first = _csNearest(foes.filter(a => { const s = _csSq(a); return Math.hypot(s[0] - A[0], s[1] - A[1]) <= R + 0.05 && _csSees(A[0], A[1], s[0], s[1]); }), A); if (!first) return bad("NO ENEMY CLOSE"); }
        const chain = [first], hop = V(def.hop), n = V(def.n);
        for (let last = first; chain.length - 1 < n;) { const l = _csSq(last), nx = _csNearest(foes.filter(a => { if (chain.indexOf(a) >= 0) return false; const s = _csSq(a); return Math.hypot(s[0] - l[0], s[1] - l[1]) <= hop + 0.05 && _csSees(l[0], l[1], s[0], s[1]); }), l); if (!nx) break; chain.push(nx); last = nx; }
        const sq = chain.map(_csSq); S.hit = def.restEff ? [sq[0]] : sq; S.eff = def.restEff ? sq.slice(1) : []; S.links = sq.map((c, i) => [i ? sq[i - 1] : A, c]);
        S.main = first; S.mask = chain; S.aim = def.self ? chain.slice() : [first];
        break; }
    case "line": {   // (its full length if it can dash it, else only up to its target: the move's own rule)
        const ang = Math.atan2(q[1] - A[1], q[0] - A[0]), L = Math.hypot(q[0] - A[0], q[1] - A[1]), len = Math.max(L, V(def.len)), far = _csWalks(A[0], A[1], A[0] + Math.cos(ang) * len, A[1] + Math.sin(ang) * len);
        S.hit = _csRay(A[0], A[1], ang, far ? len : L, (x, y) => _csFloor(x, y) && _csWalks(A[0], A[1], x, y));
        if (!S.hit.some(c => c[0] === q[0] && c[1] === q[1])) S.hit.push(q);   // (its target is always struck: the move's own rule)
        S.main = E; S.mask = _csOn(foes, S.hit); if (S.mask.indexOf(E) < 0) S.mask.push(E); S.aim = [E];
        break; }
    case "zigzag": {   // (along the way to the target, every other square one to the side, the target's own square on it; up to `len` squares, stopping at a wall)
        const dx = q[0] - A[0], dy = q[1] - A[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = uy, ny = -ux, p = Math.max(1, Math.round(L)) % 2;
        let prev = A;
        for (let k = 1; k <= def.len; k++) { const o = (k + p) % 2, x = Math.round(A[0] + ux * k + nx * o), y = Math.round(A[1] + uy * k + ny * o); if (!_csFloor(x, y) || !_csWalks(prev[0], prev[1], x, y)) break; S.hit.push([x, y]); prev = [x, y]; }
        if (!S.hit.some(c => c[0] === q[0] && c[1] === q[1])) S.hit.push(q);
        S.main = E; S.mask = _csOn(foes, S.hit); if (S.mask.indexOf(E) < 0) S.mask.push(E); S.aim = [E];
        break; }
    case "fan": {   // (each shot along its own line, stopping at the first enemy it meets: the squares lit up to it)
        const a0 = Math.atan2(q[1] - A[1], q[0] - A[0]), len = V(def.len), seen = new Set(); S.rays = [];
        for (const g of def.angles) {
            const ang = a0 + g * Math.PI / 180, tiles = _csRay(A[0], A[1], ang, len, (x, y) => _csFloor(x, y) && _csSees(A[0], A[1], x, y));
            let foe = null, upto = tiles.length; for (let i = 0; i < tiles.length; i++) { const on = _csOn(foes, [tiles[i]]); if (on.length) { foe = on[0]; upto = i + 1; break; } }
            S.rays.push({ ang, foe }); for (let i = 0; i < upto; i++) { const k = _csK(tiles[i][0], tiles[i][1]); if (!seen.has(k)) { seen.add(k); S.hit.push(tiles[i]); } }
        }
        S.main = E; S.mask = [...new Set(S.rays.map(r => r.foe).filter(Boolean))]; S.aim = [E];
        break; }
    case "swap": {
        if (typeof _evoBoss === "function" && _evoBoss(E)) return bad("NOT A BOSS");
        S.hit = [q]; S.main = E; S.mask = [E]; S.aim = [E];
        break; }
    case "blast": {
        S.tile = T; S.hit = _csDisc(T[0], T[1], V(def.r), false).filter(c => _csFloor(c[0], c[1]) && _csSees(T[0], T[1], c[0], c[1]));
        S.mask = _csOn(foes, S.hit); S.aim = [{ x: T[0], y: T[1], _csTile: true }];
        break; }
    case "decoy": {
        S.tile = T; S.eff = _csDisc(T[0], T[1], V(def.r), true).filter(c => _csFloor(c[0], c[1])); S.mask = []; S.aim = [{ x: T[0], y: T[1], _csTile: true }];
        break; }
    case "ring": {
        let r = V(def.r), heal = !!def.heal, eff = !!def.eff; const o = def.alt ? def.alt(f) : null; if (o) { r = _csV(o.r, f); heal = !!o.heal; eff = false; }
        const tiles = _csDisc(A[0], A[1], r, true).filter(c => _csFloor(c[0], c[1]) && _csSees(A[0], A[1], c[0], c[1]));
        if (heal || eff) S.eff = tiles; else S.hit = tiles;
        S.mask = heal ? [] : _csOn(foes, tiles); S.aim = heal ? foes.slice() : S.mask.slice();
        if (!heal && !S.mask.length) return bad("NO ENEMY IN ITS SQUARES");
        break; }
    default: return null;
    }
    S.maskSet = new Set(S.mask);
    return S;
}
// ── WHILE IT IS PLAYED (a card's turn in a battle, js/cardbattle.js _cb.turn.shape) ──
function _csTurn() { const T = typeof _cb !== "undefined" && _cb.phase === "on" ? _cb.turn : null; return T && T.who === "act" && T.shape ? T : null; }
// js/evolution.js _evoFoes: the enemies a move may touch, in the battle's room (the move's first look: its target; after it: the shape's enemies, wherever they stand); null: as ever
function cardShapeFoes(x, y) {
    const T = _csTurn(); if (!T) return null;
    const L = _cb.lay; if (L && L.room && typeof facilityRoomIdAt === "function" && facilityRoomIdAt(x, y) !== L.room) return null;   // (outside the battle's room the world goes on, §2.28)
    const S = T.shape;
    if (S.stage === "aim") { S.stage = "area"; return S.aim.filter(a => a && (a._csTile || _cbFoeOk(a))); }
    return S.mask.filter(_cbFoeOk);
}
// js/evolution.js _evoSees and _evoDashOk: the shape's enemies are in sight of the move and in its dash's way (the shape already took sight and walls into account)
function cardShapeSees(a) { const T = _csTurn(); return !!T && !!a && T.shape.maskSet.has(a); }
// js/helpers.js applyDamage: a blow of the card's follower (or of its shot or field) on an enemy of the battle off its shape does not land
function cardShapeSpared(target, source) {
    const T = _csTurn(); if (!T || !target || !source || target.team === "green" || !(_cb.foes.indexOf(target) >= 0 || (typeof isEnemyUnit === "function" && isEnemyUnit(target)))) return false;   // (a creature of the battle, or one outside it: §2.52)
    const who = typeof predatorSource === "function" ? predatorSource(source.by || source) : (source.by || source);
    return who === T.f && !T.shape.maskSet.has(target);
}
// js/clone.js spawnFollowerProjectile: a shot of the card's follower hits only its own: a fan's each the first enemy on its line (turned to it), any other its target
function cardShapeShot(p, actor) {
    const T = _csTurn(); if (!T || !p || actor !== T.f) return;
    const S = T.shape;
    if (S.rays && S.rays.length) {
        const ang = Math.atan2(p.vy, p.vx); let best = null, bd = Infinity;
        for (const r of S.rays) { const d = Math.abs(Math.atan2(Math.sin(ang - r.ang), Math.cos(ang - r.ang))); if (d < bd) { bd = d; best = r; } }
        const t = best && best.foe && _cbFoeOk(best.foe) ? best.foe : null; p._cbOnly = new Set(t ? [t] : []);
        if (t) { const sp = Math.hypot(p.vx, p.vy) || 0.18, dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy) || 1; p.vx = dx / d * sp; p.vy = dy / d * sp; p.life = Math.max(p.life || 0, Math.ceil(d / sp) + 10); }
        return;
    }
    p._cbOnly = new Set(S.main ? [S.main] : S.mask);
}
// PLAYED (js/cardbattle.js cardBattlePlay, a move's card): it goes off at once on its shape; a decoy is set on its square; a swap's two squares change hands; an area that stays is held for the
// battle's turns. True when it went off.
function cardShapeFire(f, id, S) {
    const mv = typeof MOVES !== "undefined" ? MOVES[id] : null; if (!mv || typeof _altFire !== "function" || !S) return false;
    const f0 = _cbF(), fx0 = new Set(typeof elementEffects !== "undefined" ? elementEffects : []), dc0 = new Set(typeof rotDecoys !== "undefined" ? rotDecoys : []);
    if (mv.manual && typeof CAP_MAX !== "undefined") f._cap = CAP_MAX;   // (CAPACITOR DISCHARGE in a battle: a full release; its recharge is the time a full charge takes, js/cardbattle.js cardBattleCards)
    f._altLive = null; f._altWind = 0; S.stage = "aim";
    try { _altFire(f, mv, f0); } finally { S.stage = "area"; }
    const fired = !!(f._altLive && f._altLive.t0 === f0); if (!fired) return false;
    if (mv.manual) f._altLive = null;   // (a release is over at once: its cycle, a meter's, never clears it)
    const newFx = typeof elementEffects !== "undefined" ? elementEffects.filter(e => !fx0.has(e)) : [], newDc = typeof rotDecoys !== "undefined" ? rotDecoys.filter(d => !dc0.has(d) && d.by === f) : [];
    if (S.def.kind === "decoy" && S.tile) for (const d of newDc) { d.x = S.tile[0]; d.y = S.tile[1]; for (const e of newFx) if (e.on === d || e.type === "decoylob") { e.x = d.x; e.y = d.y; } }   // (on the square it was dropped on)
    if (S.def.kind === "swap" && S.main) { const a = _cb.slots.get(f), b = _cb.slots.get(S.main); if (a && b) { _cb.slots.set(f, b); _cb.slots.set(S.main, a); } }   // (where each now stands is its square)
    if (f._altLive && f._altLive.list) f._altLive.list = f._altLive.list.filter(([k, o]) => !(k === "fx" && o && o.type === "buds"));   // (SEEDFALL's buds heal on round it; the card's turn does not wait for them to wither)
    for (const e of newFx) if (e.type === "buds" && e.by === f) { e._cbHeld = true; e._cbMax = e.maxLife; e._cbLeft = e.life; e.life += 1e5; e.maxLife += 1e5; }   // (their healing counts by the turns, §2.52: cardShapeBuds)
    if (S.def.stays) {   // (held: no bites of its own while the battle is on; its life put out of reach, its age kept for its look)
        const held = newFx.filter(e => e.by === f && _CS_STAYS[e.type] || (e.type === "rotdecoy" && newDc.indexOf(e.on) >= 0));
        for (const e of held) { e._cbHeld = true; e._cbTurns = CARD_SHAPE_STAY; e.life += 1e5; e.maxLife += 1e5; }
        for (const d of newDc) { d._cbHeld = true; d.until += 1e5; }
        if (f._altLive && f._altLive.list) f._altLive.list = f._altLive.list.filter(([k, o]) => !(k === "fx" && held.indexOf(o) >= 0) && !(k === "dc" && newDc.indexOf(o) >= 0));   // (the card's turn does not wait for them)
    }
    return true;
}
// SEEDFALL's buds in a battle (js/cardbattle.js _cbStatusTurn, your round over): a turn of their healing beats (`n` frames of their time), as the statuses count; their time over, they wither
function cardShapeBuds(n) {
    if (typeof elementEffects === "undefined") return;
    for (const e of elementEffects) {
        if (!e._cbHeld || e.type !== "buds" || !(e._cbLeft > 0)) continue;
        for (let i = 0; i < n && e._cbLeft > 0; i++) { e._cbLeft--; const age = e._cbMax - e._cbLeft; if (e._cbLeft > 0 && age > 0 && age % BUD_TICK === 0 && typeof budsBeat === "function") budsBeat(e); }   // (its beats as in real time: js/elements.js)
        if (!(e._cbLeft > 0)) e.life = Math.min(e.life, 24);
    }
}
// THE AREAS THAT STAY, at the turns (js/cardbattle.js): "foes", the start of the enemies' turn: each bites what stands in it; "you", the start of your round: those whose turns are over close;
// "end", the battle over: all close (SEEDFALL's buds left heal on in real time). (The draws and the bracing count by the battle's turns as every status does: js/cardbattle.js §2.52.)
function cardShapeStays(at) {
    if (typeof _cb === "undefined") return;
    const f0 = _cbF();
    if (typeof elementEffects !== "undefined") for (const e of elementEffects) {
        if (!e._cbHeld) continue;
        if (at === "foes" && e._cbTurns > 0) { try { _CS_STAYS[e.type](e); } catch (err) {} e._cbTurns--; }
        else if (e.type === "buds") { if (at === "end" && e._cbLeft > 0) { e._cbHeld = false; e.life = e._cbLeft; e.maxLife = e._cbMax; } }   // (the battle over, the buds left heal on in real time)
        else if (at === "end" || (at === "you" && !(e._cbTurns > 0))) { e._cbTurns = 0; e.life = Math.min(e.life, 24); if (e.on && e.on.until > f0) e.on.until = f0; }   // (it fades out still held: no bite of its own on the way)
    }
}
// THE LOOK, while a card is dragged (js/cardbattle.js cardBattleReticles): its squares lit on the floor where the 3D view draws them, in its colour; an effect's dashed; a blast's square in gold
function cardShapeDraw(V) {
    const D = typeof _cbDrag !== "undefined" ? _cbDrag : null; if (!D || !D.aim || !V || typeof V.screenNow !== "function" || typeof ctx === "undefined") return;
    const S = cardShapeFor(D.f, D.kind, D.id, D.aim === true ? null : D.aim); if (!S) return;
    const col = D.col || "#19e6c1", quad = (x, y, k) => { const h = 0.5 - k, P = [[x - h, y - h], [x + h, y - h], [x + h, y + h], [x - h, y + h]].map(c => V.screenNow(c[0], c[1], 0)); ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.closePath(); };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineJoin = "round";
    ctx.globalAlpha = S.ok ? 0.42 : 0.18; ctx.fillStyle = col; for (const c of S.hit) { quad(c[0], c[1], 0.05); ctx.fill(); }
    ctx.globalAlpha = S.ok ? 0.95 : 0.4; ctx.strokeStyle = col; ctx.lineWidth = 2; for (const c of S.hit) { quad(c[0], c[1], 0.05); ctx.stroke(); }
    if (ctx.setLineDash) ctx.setLineDash([6, 4]); for (const c of S.eff) { quad(c[0], c[1], 0.12); ctx.stroke(); } if (ctx.setLineDash) ctx.setLineDash([]);
    if (S.tile) { ctx.globalAlpha = 1; ctx.strokeStyle = "#ffe733"; ctx.lineWidth = 3; quad(S.tile[0], S.tile[1], 0.02); ctx.stroke(); }
    ctx.restore();
}
// the floor square of the battle's room under a point of the canvas (the 3D view's drawing), or null
function cardShapeTileAt(px, py, V) {
    const R = _csRoom(); if (!R || !R.cells.length || !V || typeof V.screenOf !== "function") return null;
    let best = null, bd = Infinity;
    for (const c of R.cells) { let s; try { s = V.screenOf(c[0], c[1], 0); } catch (e) { continue; } const d = Math.hypot(s[0] - px, s[1] - py); if (d < bd) { bd = d; best = c; } }
    if (!best) return null;
    let w = 40; try { const a = V.screenOf(best[0], best[1], 0), b = V.screenOf(best[0] + 1, best[1], 0); w = Math.max(8, Math.hypot(b[0] - a[0], b[1] - a[1])); } catch (e) {}
    return bd <= w * 0.75 ? { x: best[0], y: best[1], tile: true } : null;
}
