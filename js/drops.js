// ─────────────────────────────────────────────────────────
//  PREDATOR DEATH DROPS
// ─────────────────────────────────────────────────────────
function onPredatorDeath(predator) {
    const px = (predator.x - player.visualX - (predator.y - player.visualY)) * TILE_W + canvas.width/2;
    const py = (predator.x - player.visualX + (predator.y - player.visualY)) * TILE_H + canvas.height/2;

    // Only bosses drop shards
    if (predator.isBoss) {
        const shardsGained = predator.shardDrop || 5;
        shardCount += shardsGained;
        saveShards();
        floatingTexts.push({
            x: px, y: py - 60,
            text: "+" + shardsGained + " SHARDS",
            color: "#ff0",
            life: 90, vy: -0.8
        });
    }

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
    floatingTexts.forEach(t => {
        const alpha = Math.min(1, t.life / 30);
        ctx.globalAlpha = alpha;
        ctx.font = t.size ? `bold ${t.size}px monospace` : "bold 13px monospace";
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
