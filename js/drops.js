// ─────────────────────────────────────────────────────────
//  WHAT A KILL LEAVES, AND THE FLOATING TEXTS
// ─────────────────────────────────────────────────────────
// A creature you kill PAYS ITS WORTH IN CRYSTALS on the spot (ASKED, when the work crew and the charged mass went with the old strip game: "kills pay directly"): its class's shardDrop
// (js/species.js), said over it as "◆ n". It drops its DNA splices for the Clone Bay (js/clone.js addDNA, under "species_class"), and in the arena a case of SCRAP METAL where it fell
// (js/facilityspawn.js facilityScrapDrop), which the Armory's terminal turns into ammunition. A nymph is worth nothing (REPORTED, long ago: "make nymphs not grant any points").
function onPredatorDeath(predator) {
    if (typeof facilityScrapDrop === "function") facilityScrapDrop(predator);
    const px = (predator.x - player.visualX - (predator.y - player.visualY)) * TILE_W + canvas.width / 2;
    const py = (predator.x - player.visualX + (predator.y - player.visualY)) * TILE_H + canvas.height / 2;
    if (!isNymph(predator)) {
        const worth = Math.max(1, Math.round(predator.shardDrop || 5));
        shardCount += worth;
        floatingTexts.push({ x: px, y: py - 60, text: "◆ " + worth, color: "#ffee33", life: 90, vy: -0.8 });
    }
    // DNA: a nymph's is an ant scout's, whatever species it was, so the first kills feed the ant clones
    const speciesName = isNymph(predator) ? "ant" : (predator.speciesName || "ant");
    const className = isNymph(predator) ? "scout" : (predator.className || "scout");
    const drops = predator.dnaDrops || 1;
    if (typeof addDNA === "function") addDNA(speciesName + "_" + className, drops);
    floatingTexts.push({ x: px + 20, y: py - 40, text: "DNA: " + speciesName.toUpperCase() + " x" + drops, color: "#0f8", life: 90, vy: -0.6 });
}

// ─────────────────────────────────────────────────────────
//  FLOATING TEXT SYSTEM (floatingTexts is declared in js/config.js)
// ─────────────────────────────────────────────────────────
// ONE VOICE. A banner is a text pushed at the centre of the screen. Only the oldest batch shows and counts down — texts pushed on the same frame are one batch, so a title and its line stay together — and the
// rest wait their turn. While others wait, a batch gets at most BANNER_QUEUED_LIFE frames. A banner already waiting with the same text is not queued twice.
const BANNER_QUEUED_LIFE = 90;
function isBanner(t) { return typeof canvas !== "undefined" && Math.abs(t.x - canvas.width / 2) < 1 && t.y < canvas.height * 0.75; }
function updateFloatingTexts() {
    let head = null;
    const seen = new Set();
    floatingTexts = floatingTexts.filter(t => {
        if (isBanner(t)) {
            if (t._bq === undefined) {
                if (seen.has(t.text)) return false;   // the same banner is already queued
                t._bq = typeof frame !== "undefined" ? frame : 0;
            }
            seen.add(t.text);
            if (head === null) head = t._bq;
            if (t._bq !== head) { t._waiting = true; return true; }
            t._waiting = false;
        }
        t.y += t.vy;
        t.life--;
        return t.life > 0;
    });
    if (head !== null && floatingTexts.some(t => t._waiting))
        for (const t of floatingTexts) if (t._bq === head && t.life > BANNER_QUEUED_LIFE) t.life = BANNER_QUEUED_LIFE;
}

function drawFloatingTexts() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textAlign = "center";
    // Stamped from the text-sprite cache (cachedText in draw.js): a big fight throws up dozens of damage numbers a frame, and two fillText calls each was one of the heavier costs with a large squad.
    const stamp = typeof cachedText === "function";
    let _row = 0;
    floatingTexts.forEach(t => {
        if (t._waiting) return;             // queued behind the banner showing now
        const alpha = Math.min(1, t.life / 30);
        const _dy = isBanner(t) ? (_row++) * 18 : 0;   // banners shown together stack, one line under the other
        ctx.globalAlpha = alpha;
        const font = t.size ? `bold ${t.size}px monospace` : "bold 13px monospace";
        if (stamp) {
            cachedText(String(t.text), font, "#000", t.x + 1, t.y + 1 + _dy);
            cachedText(String(t.text), font, t.color, t.x, t.y + _dy);
            return;
        }
        ctx.font = font;
        ctx.fillStyle = "#000"; ctx.fillText(t.text, t.x + 1, t.y + 1);
        ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
}
