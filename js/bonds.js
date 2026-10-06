// ─────────────────────────────────────────────────────────
//  FOLLOWER BONDS  (docs/ROADMAP-top5.md §4)
// ─────────────────────────────────────────────────────────
// Two followers who fight side by side long enough BOND. Together (within
// BOND_TOGETHER tiles) each hits harder and takes less; if one dies the other
// goes into a RAGE; with both ultimates full and close, the double-tap fires a
// DUO ultimate. A follower bonds with one partner at a time.
//
// Every follower carries a stable `uid` (followerUid) — a respawn builds a new
// object, so a bond is kept by uid, not by reference. A respawned follower and
// a re-rolled one come back unbonded: they are someone new.
const BOND_TICK          = 30;     // frames between bond checks
const BOND_RANGE         = 2.5;    // tiles: fighting this close builds a bond
const BOND_COMBAT_WINDOW = 120;    // frames since a hit given or taken = "in combat"
const BOND_POINTS        = 40;     // checks side by side to bond (≈ 20 s)
const BOND_TOGETHER      = 3;      // tiles: the bonus holds this close
const BOND_ATTACK_MULT   = 1.15;
const BOND_DEFENSE_MULT  = 0.9;
const BOND_RAGE_FRAMES   = 600;    // 10 s
const BOND_RAGE_ATTACK   = 1.5;
const BOND_RAGE_SPEED    = 1.3;
const BOND_DUO_FRAMES    = 300;    // 5 s of the duo's damage boost after a duo ultimate
const BOND_DUO_MULT      = 1.3;
const BOND_COLOUR        = "#ff7ab8";

let followerSerial = 0;
let _bondPoints = new Map();       // "uidA-uidB" (lower first) → points
let _bondByUid  = new Map();       // uid → live follower, rebuilt each check

function followerUid(a) {
    if (!a) return 0;
    if (!a.uid) a.uid = ++followerSerial;
    else if (a.uid > followerSerial) followerSerial = a.uid;
    return a.uid;
}
function _bondKey(a, b) { const x = followerUid(a), y = followerUid(b); return x < y ? x + "-" + y : y + "-" + x; }
function bondName(a) {
    const el = (typeof ELEMENTS !== "undefined" && ELEMENTS.find(e => e.id === a.element)) || null;
    return (el ? el.label.toUpperCase() : "UNIT") + "-" + followerUid(a);
}
function bondPartner(a) {
    if (!a || !a.partnerUid) return null;
    let p = _bondByUid.get(a.partnerUid);
    if (!p || p.dead) p = (typeof followers !== "undefined" ? followers : []).find(f => f.uid === a.partnerUid && !f.dead) || null;
    return p && !p.dead && p.partnerUid === a.uid ? p : null;
}
// Partner alive and within BOND_TOGETHER tiles.
function bondTogether(a) {
    const p = bondPartner(a);
    return !!p && Math.hypot(p.x - a.x, p.y - a.y) <= BOND_TOGETHER;
}
function breakBond(a) {
    if (!a) return;
    const p = bondPartner(a);
    if (p) p.partnerUid = null;
    a.partnerUid = null;
}
// A hit given or taken: the follower is fighting (applyDamage stamps this).
function noteCombat(a) { if (a && a.isFollower) a._lastCombat = frame; }
function _inCombat(a) { return a._lastCombat !== undefined && frame - a._lastCombat <= BOND_COMBAT_WINDOW; }

// Every BOND_TICK frames: unbonded followers fighting side by side build points;
// at BOND_POINTS they bond.
function bondTick() {
    if (typeof followers === "undefined" || frame % BOND_TICK !== 0) return;
    _bondByUid = new Map();
    for (const f of followers) if (!f.dead) _bondByUid.set(followerUid(f), f);
    // A partner who is gone for good (out of the roster, not merely respawning)
    // leaves the bond open.
    for (const f of followers) if (f.partnerUid && !_bondByUid.has(f.partnerUid) && !respawnQueue.some(e => e.uid === f.partnerUid)) f.partnerUid = null;
    const free = followers.filter(f => !f.dead && !f.partnerUid && f.isFollower && !f.isClone && _inCombat(f));
    const r2 = BOND_RANGE * BOND_RANGE;
    for (let i = 0; i < free.length; i++) {
        const a = free[i];
        if (a.partnerUid) continue;
        for (let j = i + 1; j < free.length; j++) {
            const b = free[j];
            if (b.partnerUid) continue;
            const dx = a.x - b.x, dy = a.y - b.y;
            if (dx * dx + dy * dy > r2) continue;
            const k = _bondKey(a, b), pts = (_bondPoints.get(k) || 0) + 1;
            _bondPoints.set(k, pts);
            if (pts >= BOND_POINTS) {
                a.partnerUid = b.uid; b.partnerUid = a.uid;
                _bondPoints.delete(k);
                floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 96,
                    text: "♥ " + bondName(a) + " & " + bondName(b) + " BONDED", color: BOND_COLOUR, life: 180, vy: -0.18, size: 13 });
                break;
            }
        }
    }
}

// Damage multipliers, read by applyDamage. `source` gives, `target` takes.
function bondAttackMult(source) {
    if (!source || !source.isFollower) return 1;
    let m = 1;
    if (source._rageUntil > frame) m *= BOND_RAGE_ATTACK;
    if (source._duoUntil > frame) m *= BOND_DUO_MULT;
    if (source.partnerUid && bondTogether(source)) m *= BOND_ATTACK_MULT;
    return m;
}
function bondDefenseMult(target) {
    return target && target.isFollower && target.partnerUid && bondTogether(target) ? BOND_DEFENSE_MULT : 1;
}

// A follower has died: its partner rages, and the bond is over.
function bondOnDeath(a) {
    if (!a || !a.partnerUid) return;
    const p = bondPartner(a);
    a.partnerUid = null;
    if (!p) return;
    p.partnerUid = null;
    p._rageUntil = frame + BOND_RAGE_FRAMES;
    if (typeof applySlow === "function") applySlow(p, BOND_RAGE_FRAMES, BOND_RAGE_SPEED);
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 96,
        text: "☠ " + bondName(p) + " RAGES FOR " + bondName(a), color: "#ff4455", life: 160, vy: -0.18, size: 13 });
}

// The double-tap on a bonded follower with BOTH bars full and the partner
// close fires both ultimates at once, and the pair hits harder for a while.
// Returns true when it fired.
function tryDuoUltimate(a) {
    const p = bondPartner(a);
    if (!p || !bondTogether(a)) return false;
    if (!(a.ultimateCharge >= 100 && p.ultimateCharge >= 100)) return false;
    const ua = FOLLOWER_ULTIMATES[a.element], ub = FOLLOWER_ULTIMATES[p.element];
    if (!ua || !ub) return false;
    a._duoUntil = p._duoUntil = frame + BOND_DUO_FRAMES;
    ua.execute(a); ub.execute(p);
    a.ultimateCharge = 0; p.ultimateCharge = 0;
    const la = bondName(a).split("-")[0], lb = bondName(p).split("-")[0];
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 120,
        text: "♥ DUO: " + la + " × " + lb, color: BOND_COLOUR, life: 160, vy: -0.15, size: 18 });
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 12);
    return true;
}

// A thin pink line between partners standing together, a heart at its middle;
// a red ring under a raging follower. Screen space, after the world.
function drawBonds() {
    if (typeof followers === "undefined" || followers.length === 0) return;
    const W = canvas.width / 2, H = canvas.height / 2;
    const scr = o => [(o.x - player.visualX - (o.y - player.visualY)) * TILE_W + W,
                      (o.x - player.visualX + (o.y - player.visualY)) * TILE_H + H];
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const a of followers) {
        if (a.dead) continue;
        if (a._rageUntil > frame) {
            const [x, y] = scr(a);
            ctx.globalAlpha = 0.5 + 0.3 * Math.sin(frame * 0.3);
            ctx.strokeStyle = "#ff3344"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(x, y + TILE_H * 0.2, 16, 8, 0, 0, Math.PI * 2); ctx.stroke();
        }
        if (!a.partnerUid || !(a.uid < a.partnerUid)) continue;   // each pair once
        const p = bondPartner(a);
        if (!p || Math.hypot(p.x - a.x, p.y - a.y) > BOND_TOGETHER) continue;
        const [ax, ay] = scr(a), [bx, by] = scr(p);
        ctx.globalAlpha = 0.55; ctx.strokeStyle = BOND_COLOUR; ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(ax, ay - 40); ctx.lineTo(bx, by - 40); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.9;
        if (typeof cachedText === "function") cachedText("♥", "bold 10px monospace", BOND_COLOUR, (ax + bx) / 2, (ay + by) / 2 - 38);
    }
    ctx.restore();
}

// What persists: the uid and who the partner is.
function bondSaveFields(a) { return { uid: followerUid(a), partnerUid: a.partnerUid || null }; }
function bondRestoreFields(npc, entry) {
    if (entry && entry.uid) { npc.uid = entry.uid; if (entry.uid > followerSerial) followerSerial = entry.uid; }
    else followerUid(npc);
    npc.partnerUid = entry && entry.partnerUid ? entry.partnerUid : null;
}
