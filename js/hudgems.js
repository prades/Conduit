// ─────────────────────────────────────────────────────────
//  THE SHARD ICON — a small gold crystal cluster beside the shard count (HUD, top left)
// ─────────────────────────────────────────────────────────
// REPORTED: "the shards count at the top could be a rotating series of crystals that has a number near or around it" (three gold crystals turned beside the number); later "change the shard icon
// look on the main page UI, it looks bad". Picked from the options sheets (docs/images/shard-icons.png, shard-cluster.png): the crystal cluster, No. 3 "twin and chip": two tall hexagonal crystals and
// a small chunky chip in front. It is one still SVG (#shardGems, #shardCount in game.html): no SMIL, no script timer, so it costs the frame loop nothing.
const SHARD_ICON_SVG = (function () {
    const P = (pts, fill) => '<polygon points="' + pts + '" fill="' + fill + '" stroke="rgba(255,248,200,0.6)" stroke-width="0.9" stroke-linejoin="round"/>';
    // crystals are drawn in a 100 x 100 box with their base at (50,94); place() puts one where its base sits, at a scale and a lean (dim: darker, further back)
    const place = (body, x, y, s, rot, dim) => '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + s + ') translate(-50 -94)"' + (dim ? ' style="filter:brightness(' + dim + ')"' : '') + '>' + body + '</g>';
    const tall = P("50,8 26,32 26,74 50,94", "#e0a210") + P("50,8 74,32 74,74 50,94", "#ffd84a") + P("50,8 26,32 50,40 74,32", "#fff4b0") + '<polygon points="33,40 39,37 39,72 33,68" fill="rgba(255,255,235,0.45)"/>';
    const chunk = P("26,40 74,40 82,94 18,94", "#c98a08") + P("50,40 74,40 82,94 50,94", "#ffd23c") + P("26,40 50,18 82,28 74,40", "#fff4b0") + P("26,40 50,18 74,40 50,50", "#ffe680") + '<polygon points="30,50 36,48 38,84 32,86" fill="rgba(255,255,235,0.4)"/>';
    return '<svg id="shardGemsSvg" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="94" rx="30" ry="5" fill="rgba(0,0,0,0.45)"/>'
        + place(tall, 36, 92, 0.86, -6, 0.88) + place(tall, 64, 94, 0.74, 9, 0) + place(chunk, 52, 96, 0.34, 0, 0) + '</svg>';
})();
function buildShardGems() {
    if (typeof document === "undefined" || !document.getElementById) return;
    const host = document.getElementById("shardGems"); if (!host || host.firstChild) return;
    host.innerHTML = SHARD_ICON_SVG;
}
try { buildShardGems(); } catch (e) { /* no page (the test sandbox) */ }
