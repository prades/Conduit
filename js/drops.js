// ─────────────────────────────────────────────────────────
//  PREDATOR DEATH DROPS
// ─────────────────────────────────────────────────────────
function onPredatorDeath(predator) {
    const px = (predator.x - player.visualX - (predator.y - player.visualY)) * TILE_W + canvas.width/2;
    const py = (predator.x - player.visualX + (predator.y - player.visualY)) * TILE_H + canvas.height/2;

    // Every predator leaves a lump of live charged mass. It is not a pickup —
    // an ELECTRIC worker has to bleed the charge off and a FLUX worker has to
    // haul it to the Crystal before it is worth anything. See js/mass.js.
    // (It said CORE, which is the worker that rebuilds broken pylons.)
    // This lump is the ONLY shard a kill gives: there is no separate drop.
    // Anything it was carrying for a nest goes back on the ground first, so
    // killing a predator mid-delivery gives the player the stockpile too.
    if (typeof predatorDropNestMass === "function") predatorDropNestMass(predator);
    // A body left in the grub's zone is food for it (js/broods.js).
    if (typeof noteCorpse === "function") noteCorpse(predator);
    const _massValue = Math.max(1, Math.round((predator.shardDrop || 5) * MASS_VALUE_SCALE));
    spawnChargedMass(predator.x, predator.y, _massValue);
    floatingTexts.push({
        x: px, y: py - 60,
        text: "CHARGED MASS \u25c8 " + _massValue,
        color: "#ffee33",
        life: 90, vy: -0.8
    });

    // DNA splice drop
    const speciesName = predator.speciesName || "ant";
    const className   = predator.className   || "scout";
    const dnaKey      = speciesName + "_" + className;
    const baseDrops   = predator.dnaDrops || 1;
    const drops       = isCampBuilt("dna_sequencer") ? Math.ceil(baseDrops * 1.5) : baseDrops;

    addDNA(dnaKey, drops);

    floatingTexts.push({
        x: px + 20, y: py - 40,
        text: "DNA: " + speciesName.toUpperCase() + " x" + drops,
        color: "#0f8",
        life: 90, vy: -0.6
    });

    // Boss kill → drop a Crystal Modulator (only elements the player has unlocked)
    if (predator.isBoss && predator.element) {
        const FULL_TRIANGLES = {
            fire:"toxic", flux:"fire", toxic:"flux",
            electric:"ice", core:"electric", ice:"core"
        };
        const isTriple = Math.random() < 0.2;
        const rawPair = isTriple
            ? [...(MODULATOR_PAIRS[predator.element] || [predator.element]),
               FULL_TRIANGLES[predator.element]].filter(Boolean)
            : (MODULATOR_PAIRS[predator.element] || [predator.element]);
        // Filter to only include elements the player has actually unlocked
        const pair = rawPair.filter(e => unlockedElements.has(e));
        if (pair.length === 0) return; // no unlocked elements in pair — skip drop
        groundItems.push({ type:"crystalModulator", element: predator.element,
                           pair, x: predator.x, y: predator.y });
        floatingTexts.push({
            x: px, y: py - 80,
            text: `◈ ${pair.length >= 3 ? "TRIPLE " : ""}CRYSTAL MODULATOR`,
            color: "#aaddff", life: 150, vy: -0.4
        });
    }
}

// ─────────────────────────────────────────────────────────
//  FLOATING TEXT SYSTEM
// ─────────────────────────────────────────────────────────
function updateFloatingTexts() {
    floatingTexts = floatingTexts.filter(t => {
        t.y += t.vy;
        t.life--;
        return t.life > 0;
    });
}

function drawFloatingTexts() {
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.textAlign = "center";
    // Stamped from the text-sprite cache (cachedText in draw.js): a big fight
    // throws up dozens of damage numbers a frame, and two fillText calls each
    // was one of the heavier costs with a large squad. Damage numbers repeat,
    // so the cache hits.
    const stamp = typeof cachedText === "function";
    floatingTexts.forEach(t => {
        const alpha = Math.min(1, t.life / 30);
        ctx.globalAlpha = alpha;
        const font = t.size ? `bold ${t.size}px monospace` : "bold 13px monospace";
        if (stamp) {
            cachedText(String(t.text), font, "#000", t.x + 1, t.y + 1);
            cachedText(String(t.text), font, t.color, t.x, t.y);
            return;
        }
        ctx.font = font;
        // Shadow
        ctx.fillStyle = "#000";
        ctx.fillText(t.text, t.x + 1, t.y + 1);
        // Text
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
}
