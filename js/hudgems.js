// ─────────────────────────────────────────────────────────
//  THE SHARD GEMS — the shard count as turning crystals (HUD, top left)
// ─────────────────────────────────────────────────────────
// REPORTED: "the shards count at the top could be a rotating series of crystals that has a number near or around it." The shards plate is gone: three
// gold crystals turn beside the number (#shardGems, #shardCount in game.html). Each crystal is a hexagonal double pyramid; its six faces are SVG
// polygons animated by SMIL (no script timer: the page's only clock stays the game loop). A hexagon looks the same every 60 degrees, so one 60-degree
// turn of the faces loops seamlessly: each face carries the shape, the colour and the visibility of its angle, and the turn is a list of frames.
const GEM_FRAMES = 14, GEM_TURN_SECONDS = 1.3;     // a 60-degree turn; a whole revolution is six of them (about 7.8s)
function gemFace(cx, top, mid, bot, R, a0, half, lightK) {
    // The faces of one pyramid (half: -1 the upper, +1 the lower) between meridians a and a + 60 degrees, seen from the side (orthographic).
    const out = { pts: [], fill: [], vis: [] }, rad = d => d * Math.PI / 180;
    for (let f = 0; f <= GEM_FRAMES; f++) {
        const t = f / GEM_FRAMES, a = a0 + 60 * t, x1 = cx + R * Math.sin(rad(a)), x2 = cx + R * Math.sin(rad(a + 60)), apex = half < 0 ? top : bot;
        const mid_a = a + 30, facing = Math.cos(rad(mid_a)), lit = Math.max(0, Math.cos(rad(mid_a - lightK)));
        const L = (half < 0 ? 52 : 30) + 30 * lit;
        out.pts.push(cx.toFixed(1) + "," + apex.toFixed(1) + " " + x1.toFixed(1) + "," + mid.toFixed(1) + " " + x2.toFixed(1) + "," + mid.toFixed(1));
        out.fill.push("hsl(" + (half < 0 ? 50 : 41) + "," + (96 - 10 * (1 - lit)).toFixed(0) + "%," + L.toFixed(0) + "%)");
        out.vis.push(facing > 0 ? "1" : "0");
    }
    return out;
}
function gemCrystal(svgNS, cx, top, bot, R, phase) {
    const g = document.createElementNS(svgNS, "g"), mid = top + (bot - top) * 0.38;
    for (let half = -1; half <= 1; half += 2) for (let k = 0; k < 6; k++) {
        const face = gemFace(cx, top, mid, bot, R, k * 60 + phase, half, -35), poly = document.createElementNS(svgNS, "polygon");
        poly.setAttribute("points", face.pts[0]); poly.setAttribute("fill", face.fill[0]); poly.setAttribute("stroke", "rgba(255,244,190,0.55)"); poly.setAttribute("stroke-width", "0.6"); poly.setAttribute("stroke-linejoin", "round");
        const an = (name, vals, extra) => { const a = document.createElementNS(svgNS, "animate"); a.setAttribute("attributeName", name); a.setAttribute("values", vals.join(";")); a.setAttribute("dur", GEM_TURN_SECONDS + "s"); a.setAttribute("repeatCount", "indefinite"); if (extra) for (const e in extra) a.setAttribute(e, extra[e]); poly.appendChild(a); };
        an("points", face.pts); an("fill", face.fill); an("opacity", face.vis, { calcMode: "discrete" });
        g.appendChild(poly);
    }
    return g;
}
function buildShardGems() {
    if (typeof document === "undefined" || !document.getElementById) return;
    const host = document.getElementById("shardGems"); if (!host || !host.appendChild || host.firstChild) return;
    const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 92 56"); svg.setAttribute("aria-hidden", "true"); svg.id = "shardGemsSvg";
    // a big crystal in the middle, two smaller ones beside it, each a different distance round its turn
    svg.appendChild(gemCrystal(NS, 18, 20, 54, 9, 20)); svg.appendChild(gemCrystal(NS, 72, 18, 54, 9.5, 40)); svg.appendChild(gemCrystal(NS, 45, 2, 54, 14, 0));
    host.appendChild(svg);
    try { if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches && svg.pauseAnimations) svg.pauseAnimations(); } catch (e) {}
}
try { buildShardGems(); } catch (e) { /* no page (the test sandbox) */ }
