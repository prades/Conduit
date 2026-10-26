// ─────────────────────────────────────────────────────────
//  ICONS  —  one small picture for every element and system
// ─────────────────────────────────────────────────────────
// REPORTED: "make the information more intuitive by showing pictures of the
// systems and elements."
//
// Each icon is a 24x24 SVG drawn in the boxy, hard-edged style of the board,
// in the colour it is given (an element's colour). The same markup serves the
// GAME INDEX (iconSVG, straight into the page) and the canvas UI, where it is
// rasterised ONCE per icon, colour and size (iconCanvas) and stamped from then
// on, so drawing one costs a single drawImage.
//
// ICON_IDS lists them all; ELEMENT_ICON maps the game's element ids onto them.

const _ICON_DARK = "#061009";   // the cut-outs and outlines, the board's own near-black

// Each entry: (c) => the inner SVG for colour c.
const ICONS = {
    // ── ELEMENTS ──────────────────────────────────────────
    fire: c => `
        <path d="M12 2 L16.5 8 L15.6 11.2 L18.2 9.4 L19.6 14.4 Q19.6 21.6 12 22 Q4.4 21.6 4.4 14.4 L6 9.4 L8.6 12 L8.2 7 Z" fill="${c}"/>
        <path d="M12 11 L14.6 14.6 Q15.4 19.4 12 19.6 Q8.6 19.4 9.4 15.6 L10.6 16.6 Z" fill="${_ICON_DARK}" opacity="0.55"/>
        <path d="M12 14.6 L13.4 16.8 Q13.6 18.6 12 18.7 Q10.4 18.6 10.8 17.2 Z" fill="#fff" opacity="0.85"/>`,
    electric: c => `
        <path d="M14.2 1.8 L4.6 13.4 L10.6 13.4 L8.4 22.2 L19.4 9.6 L13.2 9.6 L15.6 1.8 Z" fill="${c}"/>
        <path d="M13.2 4.8 L7.6 12 L11.6 12 L10.4 16.6" fill="none" stroke="#fff" stroke-width="1" opacity="0.8"/>`,
    ice: c => `
        <g stroke="${c}" stroke-width="2.2" stroke-linecap="square" fill="none">
          <path d="M12 2 V22 M3.3 7 L20.7 17 M3.3 17 L20.7 7"/>
          <path d="M9 3.8 L12 6.4 L15 3.8 M9 20.2 L12 17.6 L15 20.2"/>
          <path d="M3.4 10.6 L6.8 10.2 L5.4 7 M20.6 13.4 L17.2 13.8 L18.6 17"/>
          <path d="M3.4 13.4 L6.8 13.8 L5.4 17 M20.6 10.6 L17.2 10.2 L18.6 7"/>
        </g>
        <path d="M12 9.2 L14.4 10.6 L14.4 13.4 L12 14.8 L9.6 13.4 L9.6 10.6 Z" fill="#fff" opacity="0.9"/>`,
    flux: c => `
        <path d="M12 2.4 A9.6 9.6 0 1 1 3.4 16.4" fill="none" stroke="${c}" stroke-width="2.4"/>
        <path d="M12 6.2 A5.8 5.8 0 1 1 6.6 14.2" fill="none" stroke="${c}" stroke-width="2.2" opacity="0.8"/>
        <path d="M12 9.6 A2.4 2.4 0 1 1 9.8 13" fill="none" stroke="${c}" stroke-width="2" opacity="0.65"/>
        <circle cx="12" cy="12" r="1.5" fill="#fff"/>
        <path d="M1.6 14.6 L3.4 16.4 L5.6 14.4" fill="none" stroke="${c}" stroke-width="2"/>`,
    core: c => `
        <path d="M12 1.8 L20.8 6.9 L20.8 17.1 L12 22.2 L3.2 17.1 L3.2 6.9 Z" fill="none" stroke="${c}" stroke-width="2.2"/>
        <path d="M12 6.4 L16.8 9.2 L16.8 14.8 L12 17.6 L7.2 14.8 L7.2 9.2 Z" fill="${c}"/>
        <path d="M12 9.4 L14.2 10.7 L14.2 13.3 L12 14.6 L9.8 13.3 L9.8 10.7 Z" fill="#fff" opacity="0.85"/>`,
    toxic: c => `
        <path d="M12 2 Q12 2 5.2 11.8 Q3 15 4.4 18.2 Q6.4 22.2 12 22.2 Q17.6 22.2 19.6 18.2 Q21 15 18.8 11.8 Q12 2 12 2 Z" fill="${c}"/>
        <circle cx="9.4" cy="16.2" r="2.4" fill="${_ICON_DARK}" opacity="0.55"/>
        <circle cx="14.6" cy="13" r="1.6" fill="${_ICON_DARK}" opacity="0.55"/>
        <circle cx="14.2" cy="18.4" r="1.1" fill="${_ICON_DARK}" opacity="0.55"/>
        <path d="M8.2 10.6 L10.6 7.2" stroke="#fff" stroke-width="1.4" opacity="0.8"/>`,
    crystal: c => `
        <path d="M12 1.6 L18.4 8.4 L12 22.4 L5.6 8.4 Z" fill="${c}"/>
        <path d="M12 1.6 L12 22.4 L5.6 8.4 Z" fill="#fff" opacity="0.25"/>
        <path d="M5.6 8.4 H18.4" stroke="${_ICON_DARK}" stroke-width="1"/>`,
    shard: c => `
        <path d="M12 3 L19 10 L12 21 L5 10 Z" fill="${c}"/>
        <path d="M5 10 H19 M9 10 L12 3 L15 10 L12 21" fill="none" stroke="${_ICON_DARK}" stroke-width="0.9" opacity="0.7"/>`,
    power: c => `
        <path d="M12 1.8 L20.8 6.9 L20.8 17.1 L12 22.2 L3.2 17.1 L3.2 6.9 Z" fill="none" stroke="${c}" stroke-width="1.8"/>
        <path d="M13.2 4.6 L7.6 13 L11.2 13 L10 19.4 L16.6 10.6 L12.8 10.6 Z" fill="${c}"/>`,
    follower: c => `
        <path d="M6 13 A6 6 0 0 1 18 13 Z" fill="${c}" opacity="0.35" stroke="${c}" stroke-width="1.6"/>
        <path d="M12 6.6 L14.2 9.6 L12 12.6 L9.8 9.6 Z" fill="#fff"/>
        <rect x="6" y="13" width="12" height="2.2" fill="${c}"/>
        <path d="M7.4 15.2 L4 21.4 M10.4 15.2 L9 21.6 M13.6 15.2 L15 21.6 M16.6 15.2 L20 21.4" stroke="${c}" stroke-width="1.6"/>`,
    clone: c => `
        <path d="M7 2 Q17 7 12 12 Q7 17 17 22" fill="none" stroke="${c}" stroke-width="2.2"/>
        <path d="M17 2 Q7 7 12 12 Q17 17 7 22" fill="none" stroke="${c}" stroke-width="2.2" opacity="0.6"/>
        <g stroke="${c}" stroke-width="1.4" opacity="0.85"><path d="M9 4.2 H15 M10.4 7.8 H13.6 M10.4 16.2 H13.6 M9 19.8 H15"/></g>`,
    predator: c => `
        <ellipse cx="12" cy="7" rx="3" ry="2.6" fill="${c}"/>
        <ellipse cx="12" cy="12" rx="2.6" ry="2.4" fill="${c}"/>
        <ellipse cx="12" cy="18" rx="3.8" ry="4" fill="${c}"/>
        <path d="M10.4 11 L4 8.6 L2.4 11 M13.6 11 L20 8.6 L21.6 11 M10 13 L3.6 15 L2.6 18 M14 13 L20.4 15 L21.4 18 M10.6 12 L5.4 12.6 M13.4 12 L18.6 12.6" fill="none" stroke="${c}" stroke-width="1.3"/>
        <path d="M10.6 5 L8.6 1.6 M13.4 5 L15.4 1.6" stroke="${c}" stroke-width="1.2"/>`,
    night: c => `
        <path d="M15.8 2.6 A9.6 9.6 0 1 0 21.4 16 A7.6 7.6 0 1 1 15.8 2.6 Z" fill="${c}"/>
        <circle cx="19" cy="5" r="0.9" fill="#fff"/><circle cx="21.4" cy="9.6" r="0.6" fill="#fff"/>`,
    wheel: c => `
        <path d="M12 3 L20.6 18 L3.4 18 Z" fill="none" stroke="${c}" stroke-width="1.8"/>
        <circle cx="12" cy="3" r="2.4" fill="#ff3300"/><circle cx="20.6" cy="18" r="2.4" fill="#9933ff"/><circle cx="3.4" cy="18" r="2.4" fill="#66ff66"/>
        <path d="M16.2 9.6 L17.4 11.6 L15 11.6 M7.2 21 L9.4 19.8 L9.4 22.2" fill="${c}" stroke="${c}" stroke-width="0.8"/>`,
    shield: c => `
        <path d="M12 2 L20 5 L20 11.4 Q20 18.6 12 22 Q4 18.6 4 11.4 L4 5 Z" fill="${c}" opacity="0.35" stroke="${c}" stroke-width="1.8"/>
        <path d="M8.4 12 L11 14.6 L16 9" fill="none" stroke="#fff" stroke-width="2"/>`,
    controls: c => `
        <path d="M9 22 L9 11.4 Q9 9.8 10.4 9.8 Q11.8 9.8 11.8 11.4 L11.8 14 L11.8 4 Q11.8 2.4 13.2 2.4 Q14.6 2.4 14.6 4 L14.6 13 L17.4 13.4 Q19.8 13.8 19.6 16.4 L19 22 Z" fill="${c}"/>
        <circle cx="13.2" cy="4.2" r="3.6" fill="none" stroke="${c}" stroke-width="1" opacity="0.6"/>`,
};
const ICON_IDS = Object.keys(ICONS);
// The game's ids onto the icon set.
const ELEMENT_ICON = { fire: "fire", electric: "electric", ice: "ice", flux: "flux", core: "core", toxic: "toxic" };

// The SVG markup for an icon, `size` css px square. Unknown ids draw nothing.
function iconSVG(id, colour, size, title) {
    const f = ICONS[id];
    if (!f) return "";
    const s = size || 18;
    return '<svg class="ix-icon" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" aria-hidden="' + (title ? "false" : "true") + '"'
         + (title ? ' role="img" aria-label="' + String(title).replace(/"/g, "&quot;") + '"' : "") + '>'
         + f(colour || "#0f8") + '</svg>';
}

// ── ON THE CANVAS ─────────────────────────────────────────
// Rasterised once per icon, colour and size into a small canvas, at twice the
// size for a sharp edge; until the SVG image has decoded (a moment, on first
// use) it returns null and the caller draws its old marker.
const _iconCanvases = new Map();
function iconCanvas(id, colour, size) {
    const key = id + "|" + colour + "|" + size;
    let e = _iconCanvases.get(key);
    if (e !== undefined) return e && e.ready ? e.cv : null;
    e = { ready: false, cv: null };
    _iconCanvases.set(key, e);
    try {
        // `in`, not `typeof`: no read of a global that may not exist (tests/globals.js).
        const Img = ("Image" in globalThis) ? globalThis.Image : null;
        if (!Img || typeof document === "undefined" || !document.createElement || !ICONS[id]) return null;
        const S = Math.max(4, Math.round(size * 2));
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + S + '" height="' + S + '" viewBox="0 0 24 24">' + ICONS[id](colour) + '</svg>';
        const img = new Img();
        img.onload = () => {
            try {
                const cv = document.createElement("canvas"); cv.width = S; cv.height = S;
                const g = cv.getContext && cv.getContext("2d");
                if (!g || typeof g.drawImage !== "function") return;
                g.drawImage(img, 0, 0, S, S);
                e.cv = cv; e.ready = true;
            } catch (err) { /* stays on the fallback marker */ }
        };
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    } catch (err) { /* stays on the fallback marker */ }
    return null;
}
// Stamp an icon centred on (x, y), `size` px. False if it is not ready yet.
function drawIcon(c, id, colour, x, y, size) {
    const cv = iconCanvas(id, colour, size);
    if (!cv) return false;
    c.drawImage(cv, x - size / 2, y - size / 2, size, size);
    return true;
}
// Start decoding the ones the HUD uses at once, so they are there by the time
// the panels first draw.
function preloadIcons() {
    if (typeof ELEMENTS === "undefined") return;
    for (const e of ELEMENTS) { iconCanvas(ELEMENT_ICON[e.id] || e.id, e.color, 14); iconCanvas(ELEMENT_ICON[e.id] || e.id, e.color, 16); iconCanvas(ELEMENT_ICON[e.id] || e.id, e.color, 10); }
}

// The index's icon slots: <i class="ix-i" data-icon="fire" data-col="#ff3300"
// data-size="16">, filled once the page is there (game.html loads this at the
// end of <body>, so it already is).
function fillIconSlots(root) {
    if (typeof document === "undefined" || !document.querySelectorAll) return 0;
    let n = 0;
    (root || document).querySelectorAll("i.ix-i[data-icon]").forEach(el => {
        if (el.firstChild) return;
        el.innerHTML = iconSVG(el.getAttribute("data-icon"), el.getAttribute("data-col"), +(el.getAttribute("data-size") || 16));
        n++;
    });
    return n;
}
try { fillIconSlots(); } catch (e) { /* no DOM (tests) */ }
