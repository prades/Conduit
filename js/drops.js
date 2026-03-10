// ─────────────────────────────────────────────────────────
//  PREDATOR DEATH DROPS
// ─────────────────────────────────────────────────────────
function onPredatorDeath(predator) {
    const shardsGained = predator.shardDrop || 5;
    shardCount += shardsGained;
    saveShards();

    // Floating shard text
    const px = (predator.x - player.visualX - (predator.y - player.visualY)) * TILE_W + canvas.width/2;
    const py = (predator.x - player.visualX + (predator.y - player.visualY)) * TILE_H + canvas.height/2;
    floatingTexts.push({
        x: px, y: py - 60,
        text: "+" + shardsGained + " SHARDS",
        color: "#ff0",
        life: 90, vy: -0.8
    });

    // DNA splice drop
    const speciesName = predator.speciesName || "ant";
    const className   = predator.className   || "scout";
    const dnaKey      = speciesName + "_" + className;
    const drops       = predator.dnaDrops || 1;

    addDNA(dnaKey, drops);

    floatingTexts.push({
        x: px + 20, y: py - 40,
        text: "DNA: " + speciesName.toUpperCase() + " x" + drops,
        color: "#0f8",
        life: 90, vy: -0.6
    });

    // Boss kill → drop a Crystal Modulator on the ground
    if (predator.isBoss && predator.element) {
        groundItems.push({ type:"crystalModulator", element: predator.element,
                           x: predator.x, y: predator.y });
        floatingTexts.push({
            x: px, y: py - 80,
            text: "◈ CRYSTAL MODULATOR", color: "#aaddff",
            life: 150, vy: -0.4
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
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    floatingTexts.forEach(t => {
        const alpha = Math.min(1, t.life / 30);
        ctx.globalAlpha = alpha;
        // Shadow
        ctx.fillStyle = "#000";
        ctx.fillText(t.text, t.x+1, t.y+1);
        // Text
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
}
