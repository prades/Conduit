// ─────────────────────────────────────────────────────────
//  FOLLOWER BONDS  (docs/ROADMAP-top5.md §4)
// ─────────────────────────────────────────────────────────
// Two followers who fight side by side long enough BOND, one partner each. A bond is for BREEDING (js/breeding.js:
// a bonded pair can breed) and for the look of it, and nothing else (build 2026-11-09b; the owner, 2026-11-09: "the
// bonuses there is none other than breeding and the visual effect"): no harder hits together, no rage when one
// falls, no DUO ultimate. When the two come really close (BOND_HEARTS.near), a few hearts float up over each and
// fade; they do not come again until the pair have been apart (BOND_HEARTS.apart) and meet again ("it doesn't stay
// active if they're right next to each other for long").
//
// Every follower carries a stable `uid` (followerUid) — a respawn builds a new
// object, so a bond is kept by uid, not by reference. A bond lasts through a fall
// (the owner: "Bond survives"): the fallen one comes back still bonded. A re-rolled
// follower comes back unbonded: it is someone new.
const BOND_TICK          = 30;     // frames between bond checks
const BOND_RANGE         = 2.5;    // tiles: fighting this close builds a bond
const BOND_COMBAT_WINDOW = 120;    // frames since a hit given or taken = "in combat"
const BOND_POINTS        = 40;     // checks side by side to bond (≈ 20 s)
const BOND_COLOUR        = "#ff7ab8";
// THE HEARTS (the owner's words, drafted 2026-11-09 and approved "As drafted"; the numbers the agent's, provisional): within `near` tiles, `count` small hearts float up over each partner for `frames`;
// not again until the two have been more than `apart` tiles from each other
const BOND_HEARTS = { near: 1, apart: 3, frames: 90, count: 3, rise: 26 };

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

// THE HEARTS: per pair (by its key, so a respawned partner keeps the pair's state), whether its hearts may show again (`armed`, true at first and again once they have been apart) and when the last
// ones began (`at`). Read each frame by drawBonds, which starts them; only drawing reads them (not saved).
let _bondHearts = new Map();
function _bondHeartTick(a, p) {
    const k = _bondKey(a, p), d = Math.hypot(p.x - a.x, p.y - a.y), H = BOND_HEARTS;
    let st = _bondHearts.get(k); if (!st) { st = { armed: true, at: -1e9 }; _bondHearts.set(k, st); }
    if (d > H.apart) st.armed = true;
    else if (d <= H.near && st.armed) { st.armed = false; st.at = frame; }
    return frame - st.at < H.frames ? (frame - st.at) / H.frames : -1;   // how far through its hearts the pair is (0..1), or -1: none showing
}
// Hearts over a pair that has just come together: BOND_HEARTS.count small pink hearts rising over each and fading (screen space, after the world)
function drawBonds() {
    if (typeof followers === "undefined" || followers.length === 0) return;
    const W = canvas.width / 2, H = canvas.height / 2, B = BOND_HEARTS;
    const scr = o => [(o.x - player.visualX - (o.y - player.visualY)) * TILE_W + W,
                      (o.x - player.visualX + (o.y - player.visualY)) * TILE_H + H];
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const a of followers) {
        if (a.dead || !a.partnerUid || !(a.uid < a.partnerUid)) continue;   // each pair once
        const p = bondPartner(a); if (!p) continue;
        const t = _bondHeartTick(a, p); if (t < 0) continue;
        for (const u of [a, p]) {
            const [x, y] = scr(u);
            for (let i = 0; i < B.count; i++) {
                const ti = Math.max(0, Math.min(1, t * 1.25 - i * 0.12));   // (each a little after the one before)
                ctx.globalAlpha = Math.max(0, 1 - ti) * 0.95;
                if (typeof cachedText === "function") cachedText("♥", "bold " + (9 + (i % 2) * 2) + "px monospace", BOND_COLOUR, x + (i - (B.count - 1) / 2) * 9 + Math.sin(ti * 6 + i) * 2, y - 44 - ti * B.rise);
            }
        }
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
