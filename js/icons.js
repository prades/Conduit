// ─────────────────────────────────────────────────────────
//  ICONS  —  one small picture for every element, pylon and system
// ─────────────────────────────────────────────────────────
// REPORTED: "make the information more intuitive by showing pictures of the
// systems and elements. Make more icons for all the elements and different
// pylons."
//
// Each icon is a 24x24 SVG drawn in the boxy, hard-edged style of the board,
// in the colour it is given (an element's colour, a pylon kind's). The same
// markup serves the GAME INDEX (iconSVG, straight into the page) and the
// canvas UI — the element panel, the build picker, the network panel — where
// it is rasterised ONCE per icon, colour and size (iconCanvas) and stamped
// from then on, so drawing one costs a single drawImage.
//
// ICON_IDS lists them all; ELEMENT_ICON / PYLON_KIND_ICON map the game's ids
// onto them.

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

    // ── PYLONS ────────────────────────────────────────────
    // A plain pylon: the fortress tower every pylon starts as.
    pylon: c => `
        <path d="M6 22 L6 8 L8 8 L8 5.6 L10 5.6 L10 8 L14 8 L14 5.6 L16 5.6 L16 8 L18 8 L18 22 Z" fill="${c}" opacity="0.9"/>
        <rect x="10.4" y="12" width="3.2" height="6" fill="${_ICON_DARK}"/>
        <rect x="4" y="21" width="16" height="2" fill="${c}"/>`,
    attack: c => `
        <path d="M5 22 L5 13 L15 13 L15 22 Z" fill="${c}" opacity="0.85"/>
        <rect x="3.4" y="21" width="13.2" height="2" fill="${c}"/>
        <path d="M6 13 L6 9 L14.4 9 L14.4 13 Z" fill="${c}"/>
        <path d="M13.6 9.2 L22.4 5 L22.4 7.8 L14.4 11.6 Z" fill="${c}"/>
        <rect x="8.4" y="10.2" width="3.2" height="1.6" fill="${_ICON_DARK}"/>
        <circle cx="21" cy="3" r="1.3" fill="#fff"/>
        <path d="M9.2 16 L11 16 L11 19 L9.2 19 Z" fill="${_ICON_DARK}"/>`,
    support: c => `
        <path d="M7 22 L7 5 L13.6 3 L13.6 20.4 Z" fill="${c}" opacity="0.9"/>
        <path d="M13.6 3 L16 4.2 L16 21.4 L13.6 20.4 Z" fill="${c}" opacity="0.55"/>
        <g fill="${_ICON_DARK}"><rect x="8.4" y="7" width="3.8" height="1.4"/><rect x="8.4" y="10.4" width="3.8" height="1.4"/><rect x="8.4" y="13.8" width="3.8" height="1.4"/></g>
        <path d="M19.2 3.4 V9.4 M16.2 6.4 H22.2" stroke="${c}" stroke-width="2.2"/>
        <path d="M17.4 14 L19.6 11.8 L21.8 14 M17.4 18 L19.6 15.8 L21.8 18" fill="none" stroke="${c}" stroke-width="1.6"/>`,
    disruption: c => `
        <path d="M7 22 L7 5 L13.6 3 L13.6 20.4 Z" fill="${c}" opacity="0.9"/>
        <path d="M13.6 3 L16 4.2 L16 21.4 L13.6 20.4 Z" fill="${c}" opacity="0.55"/>
        <g fill="${_ICON_DARK}"><rect x="8.4" y="7" width="3.8" height="1.4"/><rect x="8.4" y="10.4" width="3.8" height="1.4"/><rect x="8.4" y="13.8" width="3.8" height="1.4"/></g>
        <path d="M17.6 7 L19.6 9 L17.6 11 L19.6 13 L17.6 15 L19.6 17" fill="none" stroke="${c}" stroke-width="1.8"/>
        <path d="M20.4 5 L22.4 7 L20.4 9 L22.4 11 L20.4 13 L22.4 15 L20.4 17 L22.4 19" fill="none" stroke="${c}" stroke-width="1.4" opacity="0.7"/>`,
    battery: c => `
        <rect x="8.6" y="1.8" width="2.4" height="2.4" fill="${c}"/>
        <rect x="13" y="1.8" width="2.4" height="2.4" fill="#6b7487"/>
        <rect x="5" y="4" width="14" height="18.4" rx="1.4" fill="#1e2533" stroke="${c}" stroke-width="1.6"/>
        <g fill="${c}"><rect x="7.6" y="16.6" width="8.8" height="3.2"/><rect x="7.6" y="12.4" width="8.8" height="3.2"/><rect x="7.6" y="8.2" width="8.8" height="3.2" opacity="0.4"/></g>`,
    connector: c => `
        <rect x="2" y="9" width="6" height="6" fill="${c}"/>
        <rect x="16" y="9" width="6" height="6" fill="${c}"/>
        <path d="M8 12 H16" stroke="${c}" stroke-width="2" stroke-dasharray="2 1.6"/>
        <path d="M5 9 V4 H19 V9" fill="none" stroke="${c}" stroke-width="1.6"/>
        <path d="M5 15 V20 H19 V15" fill="none" stroke="${c}" stroke-width="1.6" opacity="0.6"/>
        <circle cx="12" cy="4" r="1.8" fill="#fff"/>`,
    generator: c => `
        <path d="M2.6 13.4 A9.4 9.4 0 0 1 21.4 13.4" fill="none" stroke="${c}" stroke-width="1.6" stroke-dasharray="2.4 1.6"/>
        <path d="M8 22 L8 14 L16 14 L16 22 Z" fill="#8a96a8"/>
        <rect x="6.4" y="21" width="11.2" height="2" fill="#8a96a8"/>
        <circle cx="12" cy="10" r="4.4" fill="${c}"/>
        <circle cx="10.6" cy="8.6" r="1.4" fill="#fff" opacity="0.9"/>`,
    mk2: c => `
        <path d="M12 1.6 L22.4 12 L12 22.4 L1.6 12 Z" fill="none" stroke="${c}" stroke-width="2"/>
        <path d="M7 13.4 L12 8.4 L17 13.4" fill="none" stroke="${c}" stroke-width="2.4"/>
        <path d="M7 17.4 L12 12.4 L17 17.4" fill="none" stroke="${c}" stroke-width="2.4" opacity="0.7"/>`,

    // ── STRUCTURES (four pylons fused) ────────────────────
    ultra: c => `
        <path d="M12 23 L22.4 17.6 L22.4 13.2 L12 18.6 L1.6 13.2 L1.6 17.6 Z" fill="#2a3242"/>
        <path d="M1.6 13.2 L12 7.8 L22.4 13.2 L12 18.6 Z" fill="#3a4458"/>
        <g fill="${c}"><rect x="2.8" y="8.4" width="1.6" height="5"/><rect x="19.6" y="8.4" width="1.6" height="5"/><rect x="11.2" y="13.6" width="1.6" height="5"/></g>
        <rect x="10.6" y="5.4" width="2.8" height="8.6" fill="#1a2030"/>
        <g fill="none" stroke="${c}" stroke-width="1.3"><ellipse cx="12" cy="12" rx="2.8" ry="1"/><ellipse cx="12" cy="9.6" rx="2.8" ry="1"/><ellipse cx="12" cy="7.2" rx="2.8" ry="1"/></g>
        <ellipse cx="12" cy="3.6" rx="4.4" ry="1.8" fill="none" stroke="${c}" stroke-width="1.8"/>
        <path d="M4 8 L6.6 6.4 L6 5 L8.6 3.8 M20 8 L17.4 6.4 L18 5 L15.4 3.8" fill="none" stroke="#fff" stroke-width="0.9"/>`,
    blackhole: c => `
        <ellipse cx="12" cy="13" rx="10.4" ry="6.4" fill="none" stroke="${c}" stroke-width="1.6" opacity="0.6"/>
        <path d="M3.6 13 Q6 7.6 12 8.4 Q18.6 9.4 17.6 13.4 Q16.6 17 12 16.4" fill="none" stroke="${c}" stroke-width="2"/>
        <path d="M20.4 13 Q18 18.4 12 17.6 Q5.4 16.6 6.4 12.6 Q7.4 9 12 9.6" fill="none" stroke="${c}" stroke-width="2" opacity="0.75"/>
        <ellipse cx="12" cy="13" rx="3.4" ry="2.2" fill="#000" stroke="#fff" stroke-width="0.8"/>`,
    firespin: c => `
        <ellipse cx="12" cy="17" rx="9.6" ry="4.4" fill="none" stroke="${c}" stroke-width="1.2" opacity="0.6"/>
        <path d="M12 15 L6.4 4 L10.6 6.4 L12 2 L13.4 6.4 L17.6 4 Z" fill="${c}"/>
        <path d="M12 15 L2 17.6 L5 14.4 L1.6 11.6 L6.2 12.2 L5.8 8 Z" fill="${c}" opacity="0.8"/>
        <path d="M12 15 L22 17.6 L19 14.4 L22.4 11.6 L17.8 12.2 L18.2 8 Z" fill="${c}" opacity="0.8"/>
        <circle cx="12" cy="15" r="2.2" fill="#fff"/>`,
    icegen: c => `
        <ellipse cx="12" cy="19" rx="10.4" ry="3.6" fill="${c}" opacity="0.3"/>
        <path d="M12 1.6 L15 8 L14 19 L10 19 L9 8 Z" fill="${c}"/>
        <path d="M6 7.4 L8.6 11.4 L8.4 19.4 L5 19.4 L4 12 Z" fill="${c}" opacity="0.75"/>
        <path d="M18 7.4 L20 12 L19 19.4 L15.6 19.4 L15.4 11.4 Z" fill="${c}" opacity="0.75"/>
        <path d="M12 3.6 L13.2 8.4 L12.6 16" stroke="#fff" stroke-width="0.9" fill="none"/>`,
    toxtower: c => `
        <rect x="6" y="15.6" width="12" height="6.4" fill="#2a2f2a"/>
        <rect x="7" y="10" width="10" height="5.6" fill="#323832"/>
        <rect x="8" y="5" width="8" height="5" fill="#3a413a"/>
        <g fill="${c}"><rect x="8" y="17.6" width="8" height="1.6"/><rect x="9" y="12" width="6" height="1.4"/><rect x="10" y="6.8" width="4" height="1.2"/></g>
        <path d="M12 5 Q9.6 3.4 11 1.8 M14.4 5 Q16.6 3.2 15.4 1.4" fill="none" stroke="${c}" stroke-width="1.4"/>
        <path d="M18 12.6 Q21 11.6 20.4 9.4 M6 12.6 Q3 11.6 3.6 9.4" fill="none" stroke="${c}" stroke-width="1.2" opacity="0.75"/>`,

    // ── SYSTEMS ───────────────────────────────────────────
    nest: c => `
        <path d="M2 22 L2 9 Q12 0.6 22 9 L22 22 Z" fill="#1a1220"/>
        <path d="M12 6.6 A6 6 0 1 1 6.6 13.4" fill="none" stroke="${c}" stroke-width="2"/>
        <path d="M12 9.6 A3 3 0 1 1 9.4 13" fill="none" stroke="${c}" stroke-width="1.8" opacity="0.7"/>
        <circle cx="12" cy="13" r="1.2" fill="#fff"/>`,
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
    tier: c => `
        <rect x="3" y="15.6" width="18" height="5.4" fill="${c}"/>
        <rect x="6" y="9.6" width="12" height="4.6" fill="${c}" opacity="0.75"/>
        <rect x="9" y="4" width="6" height="4.2" fill="${c}" opacity="0.5"/>`,
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
    machine: c => `
        <path d="M4.6 15 Q4 4.6 12 4 Q20 4.6 19.4 15 Z" fill="${c}" opacity="0.8"/>
        <path d="M7.4 9.6 Q8.6 6.2 12 6" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.7"/>
        <path d="M6 15 Q5 18.6 7 22 M9.4 15 Q8.6 19 10 22.4 M14.6 15 Q15.4 19 14 22.4 M18 15 Q19 18.6 17 22" fill="none" stroke="${c}" stroke-width="1.6"/>`,
    thief: c => `
        <circle cx="10" cy="5" r="2.6" fill="${c}"/>
        <path d="M10 8 L8.4 14.4 L4.6 20.6 M8.4 14.4 L12.6 17 L12 22 M9.4 9.6 L4.4 12 M9.6 10 L14.6 9" fill="none" stroke="${c}" stroke-width="2"/>
        <path d="M18 5 L21.6 9 L18 14 L14.4 9 Z" fill="#7fffd4"/>`,
    night: c => `
        <path d="M15.8 2.6 A9.6 9.6 0 1 0 21.4 16 A7.6 7.6 0 1 1 15.8 2.6 Z" fill="${c}"/>
        <circle cx="19" cy="5" r="0.9" fill="#fff"/><circle cx="21.4" cy="9.6" r="0.6" fill="#fff"/>`,
    wheel: c => `
        <path d="M12 3 L20.6 18 L3.4 18 Z" fill="none" stroke="${c}" stroke-width="1.8"/>
        <circle cx="12" cy="3" r="2.4" fill="#ff3300"/><circle cx="20.6" cy="18" r="2.4" fill="#9933ff"/><circle cx="3.4" cy="18" r="2.4" fill="#66ff66"/>
        <path d="M16.2 9.6 L17.4 11.6 L15 11.6 M7.2 21 L9.4 19.8 L9.4 22.2" fill="${c}" stroke="${c}" stroke-width="0.8"/>`,
    worker: c => `
        <path d="M4.4 19.6 L13.6 10.4" stroke="${c}" stroke-width="2.6"/>
        <path d="M11 4.4 Q17.4 2.6 20.6 9 L18 9.4 Q16 6.6 12.6 7 Z" fill="${c}"/>
        <rect x="2.4" y="18.4" width="3.6" height="3.6" fill="${c}" transform="rotate(45 4.2 20.2)"/>`,
    teleport: c => `
        <ellipse cx="12" cy="17" rx="8.6" ry="3.6" fill="none" stroke="${c}" stroke-width="1.8"/>
        <ellipse cx="12" cy="17" rx="4.4" ry="1.8" fill="${c}" opacity="0.5"/>
        <path d="M12 2 V12 M8.4 8.4 L12 12 L15.6 8.4" fill="none" stroke="${c}" stroke-width="2"/>`,
    overcharge: c => `
        <path d="M13.2 1.6 L5.6 13 L10.4 13 L8.8 22.4 L17.6 9.8 L12.6 9.8 L14.6 1.6 Z" fill="${c}"/>
        <path d="M18.8 15.4 V21.4 M15.8 18.4 H21.8" stroke="${c}" stroke-width="2"/>`,
    shield: c => `
        <path d="M12 2 L20 5 L20 11.4 Q20 18.6 12 22 Q4 18.6 4 11.4 L4 5 Z" fill="${c}" opacity="0.35" stroke="${c}" stroke-width="1.8"/>
        <path d="M8.4 12 L11 14.6 L16 9" fill="none" stroke="#fff" stroke-width="2"/>`,
    zone: c => `
        <path d="M2 18 L12 23 L22 18 L12 13 Z" fill="${c}" opacity="0.4"/>
        <path d="M2 12 L12 17 L22 12 L12 7 Z" fill="${c}" opacity="0.7"/>
        <path d="M2 6 L12 11 L22 6 L12 1 Z" fill="${c}"/>`,
    controls: c => `
        <path d="M9 22 L9 11.4 Q9 9.8 10.4 9.8 Q11.8 9.8 11.8 11.4 L11.8 14 L11.8 4 Q11.8 2.4 13.2 2.4 Q14.6 2.4 14.6 4 L14.6 13 L17.4 13.4 Q19.8 13.8 19.6 16.4 L19 22 Z" fill="${c}"/>
        <circle cx="13.2" cy="4.2" r="3.6" fill="none" stroke="${c}" stroke-width="1" opacity="0.6"/>`,
};
const ICON_IDS = Object.keys(ICONS);
// The game's ids onto the icon set.
const ELEMENT_ICON = { fire: "fire", electric: "electric", ice: "ice", flux: "flux", core: "core", toxic: "toxic" };
const PYLON_KIND_ICON = { attack: "attack", support: "support", disruption: "disruption", battery: "battery",
                          connector: "connector", generator: "generator" };
const FORMATION_ICON = { blackhole: "blackhole", firespin: "firespin", icegen: "icegen", toxtower: "toxtower" };

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
    if (typeof PYLON_KINDS !== "undefined") for (const k of PYLON_KINDS) iconCanvas(PYLON_KIND_ICON[k.id] || "pylon", k.color, 16);
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
