// AN ENERGY CARD'S 3D GEM (`docs/ENERGY-CARDS.md` §9, build 2026-11-12n): each element has its own gem on the card's face,
// in place of the old plasma blobs (2026-11-09nn, kept in the history). The owner's picks, element by element:
//   fire     · a crooked crystal cluster of three with two shards behind
//   ice      · a crisp hexagonal prism tower with a smaller companion prism
//   electric · a magnetic geode cracked open, yellow crystals pointing inward from the walls, four grown out through
//              the shell, field lines ringing it and arcs flickering between the shards
//   flux     · two 3-sided pyramids base-to-base, spinning together and gyrating (a couple, not opposed): a per-frame
//              3D projection with painter's-sort faces and light-based shading
//   core     · a translucent teal "flubber" blob, squash-and-stretch jiggle plus a slow wobble, three droplets bouncing
//              on their own round it
//   toxic    · a green bubble with eight half-bubbles welling up on its surface, spinning + gyrating (the core bubble's
//              shape in a toxic palette)
//   blossom  · a lotus of eight outer petals, seven mid petals offset, five inner petals, a gold stamen centre
// A card's .cd-en still carries the mask that fades its bottom under the text, and each element's animations pause
// under a pack's reveal and with reduced motion (game.html's "AN ENERGY CARD's 3D GEM").

// ─── static SVGs (no per-frame work) ─────────────────────────────────────────
const ENERGY_GEM_SVG = {};

ENERGY_GEM_SVG.fire = `
<svg viewBox="-80 -120 160 200" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="egF_L" x1="0" y1="-1" x2="0.1" y2="1">
      <stop offset="0" stop-color="#ffeeaa"/><stop offset="0.25" stop-color="#ffaa44"/><stop offset="0.6" stop-color="#cc3300"/><stop offset="1" stop-color="#441000"/>
    </linearGradient>
    <linearGradient id="egF_D" x1="0" y1="-1" x2="-0.15" y2="1">
      <stop offset="0" stop-color="#8a2200"/><stop offset="0.5" stop-color="#3f0a00"/><stop offset="1" stop-color="#180000"/>
    </linearGradient>
    <linearGradient id="egF_R" x1="0" y1="-1" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffcc"/><stop offset="0.25" stop-color="#ffbb44"/><stop offset="0.75" stop-color="#660000"/><stop offset="1" stop-color="#2a0000"/>
    </linearGradient>
    <linearGradient id="egF_BL" x1="0" y1="-1" x2="0.1" y2="1">
      <stop offset="0" stop-color="#cc6622"/><stop offset="0.5" stop-color="#772200"/><stop offset="1" stop-color="#2a0800"/>
    </linearGradient>
    <linearGradient id="egF_BD" x1="0" y1="-1" x2="-0.1" y2="1">
      <stop offset="0" stop-color="#4a1500"/><stop offset="1" stop-color="#100000"/>
    </linearGradient>
    <radialGradient id="egF_I" cx="0.5" cy="0.55">
      <stop offset="0" stop-color="#fff0aa" stop-opacity="1"/><stop offset="0.4" stop-color="#ff8822" stop-opacity="0.7"/><stop offset="1" stop-color="#ff3300" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="egF_H" cx="0.5" cy="0.5">
      <stop offset="0" stop-color="#ff6600" stop-opacity="0.7"/><stop offset="1" stop-color="#ff3300" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="0" cy="-10" rx="85" ry="100" fill="url(#egF_H)" opacity="0.35"/>
  <ellipse cx="4" cy="60" rx="46" ry="7" fill="#000" opacity="0.6"/>
  <g opacity="0.85" transform="translate(-14 15) rotate(-14)">
    <polygon points="0,-122 10,-88 14,-32 8,18 -2,52 -1,-30" fill="url(#egF_BD)"/>
    <polygon points="0,-122 -1,-30 -2,52 -11,16 -15,-32 -8,-88" fill="url(#egF_BL)"/>
    <polygon points="0,-122 -0.5,-30 -2,52 -3,52 -1.5,-30 -0.5,-88" fill="url(#egF_R)" opacity="0.75"/>
  </g>
  <g opacity="0.85" transform="translate(16 18) rotate(16)">
    <polygon points="0,-116 11,-82 15,-28 8,20 -2,50 -1,-28" fill="url(#egF_BD)"/>
    <polygon points="0,-116 -1,-28 -2,50 -11,18 -15,-28 -8,-82" fill="url(#egF_BL)"/>
    <polygon points="0,-116 -0.5,-28 -2,50 -3,50 -1.5,-28 -0.5,-82" fill="url(#egF_R)" opacity="0.75"/>
  </g>
  <g transform="translate(-2 -10)">
    <polygon points="4,-85 14,-55 16,-10 10,32 0,55 2,-20" fill="url(#egF_D)"/>
    <polygon points="4,-85 2,-20 0,55 -10,30 -14,-10 -6,-55" fill="url(#egF_L)"/>
    <polygon points="4,-85 3,-20 0,55 -2,55 1,-20 3,-55" fill="url(#egF_R)" opacity="0.9"/>
    <path d="M4,-85 L -6,-55 L -14,-10" stroke="#ffeebb" stroke-width="1.2" fill="none" opacity="0.65"/>
  </g>
  <g transform="translate(-28 10) rotate(-22)">
    <polygon points="0,-82 11,-55 13,-10 8,25 -2,45 -2,-20" fill="url(#egF_D)"/>
    <polygon points="0,-82 -2,-20 -2,45 -11,22 -14,-10 -6,-55" fill="url(#egF_L)"/>
    <polygon points="0,-82 -0.5,-20 -2,45 -3,45 -2,-20 -1,-55" fill="url(#egF_R)" opacity="0.82"/>
  </g>
  <g transform="translate(26 8) rotate(24)">
    <polygon points="0,-78 12,-52 14,-8 8,28 -2,46 -1,-20" fill="url(#egF_D)"/>
    <polygon points="0,-78 -1,-20 -2,46 -11,24 -14,-8 -6,-52" fill="url(#egF_L)"/>
    <polygon points="0,-78 -0.5,-20 -2,46 -3,46 -2,-20 -1,-52" fill="url(#egF_R)" opacity="0.82"/>
  </g>
  <g class="eg-inner">
    <ellipse cx="-2" cy="20" rx="30" ry="26" fill="url(#egF_I)"/>
    <ellipse cx="0" cy="-30" rx="14" ry="20" fill="url(#egF_I)" opacity="0.7"/>
  </g>
  <ellipse cx="2" cy="57" rx="34" ry="5" fill="#ff5500" opacity="0.8"/>
  <ellipse cx="2" cy="58" rx="50" ry="3" fill="#ff8822" opacity="0.5"/>
</svg>`;

ENERGY_GEM_SVG.ice = `
<svg viewBox="-80 -120 160 200" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="egI_L" x1="0" y1="-1" x2="0.15" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.3" stop-color="#cceeff"/><stop offset="0.7" stop-color="#4499cc"/><stop offset="1" stop-color="#0a2a4a"/>
    </linearGradient>
    <linearGradient id="egI_D" x1="0" y1="-1" x2="-0.15" y2="1">
      <stop offset="0" stop-color="#336688"/><stop offset="0.5" stop-color="#153448"/><stop offset="1" stop-color="#02101e"/>
    </linearGradient>
    <linearGradient id="egI_R" x1="0" y1="-1" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.3" stop-color="#aaddff"/><stop offset="0.75" stop-color="#1a4870"/><stop offset="1" stop-color="#02101e"/>
    </linearGradient>
    <radialGradient id="egI_I" cx="0.5" cy="0.55">
      <stop offset="0" stop-color="#ffffff" stop-opacity="1"/><stop offset="0.4" stop-color="#99ddff" stop-opacity="0.7"/><stop offset="1" stop-color="#4499cc" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="egI_H" cx="0.5" cy="0.5">
      <stop offset="0" stop-color="#99ddff" stop-opacity="0.55"/><stop offset="1" stop-color="#2a5080" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="0" cy="-10" rx="70" ry="110" fill="url(#egI_H)" opacity="0.4"/>
  <ellipse cx="4" cy="60" rx="34" ry="6" fill="#000" opacity="0.55"/>
  <g transform="translate(-2 -10) rotate(4)">
    <polygon points="-2,-95 -18,-78 -22,45 -4,58 -2,-10" fill="url(#egI_D)"/>
    <polygon points="-2,-95 16,-78 20,45 -4,58 -2,-10" fill="url(#egI_L)"/>
    <polygon points="-2,-95 -2,-10 -4,58 -6,58 -5,-10 -5,-95" fill="url(#egI_R)" opacity="0.88"/>
    <polygon points="-2,-95 16,-78 -2,-92 -18,-78" fill="#eef9ff" opacity="0.85"/>
    <polygon points="-2,-95 16,-78 0,-95" fill="#66aad0" opacity="0.6"/>
    <path d="M-2,-95 L -18,-78 L -22,45" stroke="#eef9ff" stroke-width="1.3" fill="none" opacity="0.8"/>
    <path d="M-2,-95 L 16,-78 L 20,45" stroke="#eef9ff" stroke-width="1" fill="none" opacity="0.4"/>
  </g>
  <g transform="translate(26 25) rotate(14)">
    <polygon points="0,-62 -10,-50 -12,30 -2,42 0,-10" fill="url(#egI_D)"/>
    <polygon points="0,-62 10,-50 12,30 -2,42 0,-10" fill="url(#egI_L)"/>
    <polygon points="0,-62 0,-10 -2,42 -3,42 -2,-10 -1,-50" fill="url(#egI_R)" opacity="0.88"/>
    <polygon points="0,-62 10,-50 0,-60 -10,-50" fill="#eef9ff" opacity="0.85"/>
  </g>
  <g class="eg-inner">
    <ellipse cx="-4" cy="-10" rx="10" ry="38" fill="url(#egI_I)"/>
    <ellipse cx="22" cy="18" rx="6" ry="20" fill="url(#egI_I)" opacity="0.7"/>
  </g>
  <ellipse cx="2" cy="57" rx="30" ry="5" fill="#99ddff" opacity="0.4"/>
  <ellipse cx="2" cy="58" rx="46" ry="3" fill="#ffffff" opacity="0.25"/>
</svg>`;

ENERGY_GEM_SVG.electric = `
<svg viewBox="-110 -120 220 210" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="egE_L" x1="0" y1="-1" x2="0.1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.3" stop-color="#ffff99"/><stop offset="0.7" stop-color="#ccaa22"/><stop offset="1" stop-color="#443300"/>
    </linearGradient>
    <linearGradient id="egE_D" x1="0" y1="-1" x2="-0.15" y2="1">
      <stop offset="0" stop-color="#776600"/><stop offset="0.5" stop-color="#3a2f00"/><stop offset="1" stop-color="#1a1400"/>
    </linearGradient>
    <linearGradient id="egE_R" x1="0" y1="-1" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.3" stop-color="#ffff77"/><stop offset="1" stop-color="#443300"/>
    </linearGradient>
    <linearGradient id="egE_rockL" x1="0" y1="-1" x2="0" y2="1">
      <stop offset="0" stop-color="#4a3a1a"/><stop offset="0.5" stop-color="#2a2008"/><stop offset="1" stop-color="#140d02"/>
    </linearGradient>
    <linearGradient id="egE_rockD" x1="0" y1="-1" x2="0" y2="1">
      <stop offset="0" stop-color="#2a2008"/><stop offset="1" stop-color="#0a0600"/>
    </linearGradient>
    <radialGradient id="egE_C" cx="0.5" cy="0.5">
      <stop offset="0" stop-color="#ffff99" stop-opacity="1"/><stop offset="0.4" stop-color="#ddaa00" stop-opacity="0.7"/><stop offset="0.8" stop-color="#441a00" stop-opacity="0.8"/><stop offset="1" stop-color="#140800" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="egE_I" cx="0.5" cy="0.5">
      <stop offset="0" stop-color="#ffffff" stop-opacity="1"/><stop offset="0.4" stop-color="#ffff33" stop-opacity="0.9"/><stop offset="1" stop-color="#ddaa00" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="egE_H" cx="0.5" cy="0.5">
      <stop offset="0" stop-color="#ffee33" stop-opacity="0.55"/><stop offset="1" stop-color="#776600" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="0" cy="-15" rx="100" ry="105" fill="url(#egE_H)" opacity="0.5"/>
  <ellipse cx="4" cy="65" rx="38" ry="6" fill="#000" opacity="0.55"/>
  <g class="eg-field" opacity="0.55" stroke="url(#egE_L)" fill="none" stroke-dasharray="3 4">
    <ellipse cx="0" cy="-15" rx="92" ry="78" stroke-width="0.8"/>
    <ellipse cx="0" cy="-15" rx="76" ry="94" stroke-width="0.6"/>
  </g>
  <g transform="translate(-38 -58) rotate(-32)">
    <polygon points="0,0 10,-14 7,-37 0,-46 -7,-37 -10,-14" fill="url(#egE_D)"/>
    <polygon points="0,0 -10,-14 -7,-37 0,-46" fill="url(#egE_L)"/>
    <polygon points="0,0 0.5,-18 0,-46 -0.5,-18" fill="url(#egE_R)" opacity="0.9"/>
  </g>
  <g transform="translate(40 -46) rotate(38)">
    <polygon points="0,0 10,-13 7,-35 0,-44 -7,-35 -10,-13" fill="url(#egE_D)"/>
    <polygon points="0,0 -10,-13 -7,-35 0,-44" fill="url(#egE_L)"/>
    <polygon points="0,0 0.5,-18 0,-44 -0.5,-18" fill="url(#egE_R)" opacity="0.9"/>
  </g>
  <g transform="translate(-62 10) rotate(-82)">
    <polygon points="0,0 9,-12 6,-32 0,-40 -6,-32 -9,-12" fill="url(#egE_D)"/>
    <polygon points="0,0 -9,-12 -6,-32 0,-40" fill="url(#egE_L)"/>
  </g>
  <g transform="translate(62 14) rotate(82)">
    <polygon points="0,0 9,-12 6,-32 0,-42 -6,-32 -9,-12" fill="url(#egE_D)"/>
    <polygon points="0,0 -9,-12 -6,-32 0,-42" fill="url(#egE_L)"/>
  </g>
  <path d="M -62 -50 Q -78 -32 -74 0 Q -82 30 -62 50 Q -40 62 -4 58 Q 36 62 58 44 Q 76 22 70 -8 Q 78 -34 60 -52 Q 36 -66 2 -68 Q -32 -66 -62 -50 Z" fill="url(#egE_rockD)"/>
  <path d="M -62 -50 Q -78 -32 -74 0 Q -82 30 -62 50 Q -56 26 -60 0 Q -56 -28 -40 -46 Z" fill="url(#egE_rockL)" opacity="0.7"/>
  <ellipse cx="-2" cy="-6" rx="42" ry="42" fill="url(#egE_C)"/>
  <ellipse cx="-2" cy="-6" rx="42" ry="42" fill="none" stroke="#ffee88" stroke-width="1.5" opacity="0.6"/>
  <g transform="translate(-36 -22) rotate(50)"><polygon points="0,0 5,-6 4,-16 0,-22 -4,-16 -5,-6" fill="url(#egE_D)"/><polygon points="0,0 -5,-6 -4,-16 0,-22" fill="url(#egE_L)"/></g>
  <g transform="translate(-28 16) rotate(85)"><polygon points="0,0 5,-7 4,-16 0,-24 -4,-16 -5,-7" fill="url(#egE_D)"/><polygon points="0,0 -5,-7 -4,-16 0,-24" fill="url(#egE_L)"/></g>
  <g transform="translate(14 30) rotate(195)"><polygon points="0,0 5,-6 4,-14 0,-20 -4,-14 -5,-6" fill="url(#egE_D)"/><polygon points="0,0 -5,-6 -4,-14 0,-20" fill="url(#egE_L)"/></g>
  <g transform="translate(32 10) rotate(238)"><polygon points="0,0 5,-7 4,-16 0,-24 -4,-16 -5,-7" fill="url(#egE_D)"/><polygon points="0,0 -5,-7 -4,-16 0,-24" fill="url(#egE_L)"/></g>
  <g transform="translate(34 -22) rotate(286)"><polygon points="0,0 5,-6 4,-14 0,-20 -4,-14 -5,-6" fill="url(#egE_D)"/><polygon points="0,0 -5,-6 -4,-14 0,-20" fill="url(#egE_L)"/></g>
  <g transform="translate(-14 -38) rotate(25)"><polygon points="0,0 4,-5 3,-12 0,-18 -3,-12 -4,-5" fill="url(#egE_D)"/><polygon points="0,0 -4,-5 -3,-12 0,-18" fill="url(#egE_L)"/></g>
  <g transform="translate(16 -38) rotate(335)"><polygon points="0,0 4,-5 3,-12 0,-18 -3,-12 -4,-5" fill="url(#egE_D)"/><polygon points="0,0 -4,-5 -3,-12 0,-18" fill="url(#egE_L)"/></g>
  <g class="eg-inner"><ellipse cx="-2" cy="-6" rx="18" ry="20" fill="url(#egE_I)"/></g>
  <polyline class="eg-arc a" points="-22,-18 -6,-2 -14,8 4,12" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="miter" stroke-linecap="round" filter="drop-shadow(0 0 2px #ffff66) drop-shadow(0 0 5px #ffee33)"/>
  <polyline class="eg-arc b" points="-36,-56 -24,-48 -32,-36 -20,-28" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="miter" stroke-linecap="round" filter="drop-shadow(0 0 2px #ffff66) drop-shadow(0 0 5px #ffee33)"/>
  <polyline class="eg-arc c" points="34,-46 24,-38 34,-26 22,-18" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="miter" stroke-linecap="round" filter="drop-shadow(0 0 2px #ffff66) drop-shadow(0 0 5px #ffee33)"/>
</svg>`;

ENERGY_GEM_SVG.core = `
<svg viewBox="-110 -120 220 240" preserveAspectRatio="xMidYMid meet">
  <defs>
    <radialGradient id="egC_gel" cx="0.35" cy="0.28" r="0.8">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="0.15" stop-color="#ddfff6" stop-opacity="0.75"/><stop offset="0.5" stop-color="#33ddbb" stop-opacity="0.55"/><stop offset="0.85" stop-color="#005544" stop-opacity="0.75"/><stop offset="1" stop-color="#001a14" stop-opacity="0.9"/>
    </radialGradient>
    <radialGradient id="egC_core" cx="0.5" cy="0.55">
      <stop offset="0" stop-color="#ffffff" stop-opacity="1"/><stop offset="0.4" stop-color="#77ffdd" stop-opacity="0.65"/><stop offset="1" stop-color="#00ccaa" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="egC_drop" cx="0.3" cy="0.25" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="0.5" stop-color="#55eecc" stop-opacity="0.8"/><stop offset="1" stop-color="#003a30" stop-opacity="0.9"/>
    </radialGradient>
    <radialGradient id="egC_H" cx="0.5" cy="0.5">
      <stop offset="0" stop-color="#00ccaa" stop-opacity="0.55"/><stop offset="1" stop-color="#002a22" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="0" cy="-5" rx="100" ry="95" fill="url(#egC_H)" opacity="0.55"/>
  <ellipse cx="4" cy="92" rx="38" ry="6" fill="#000" opacity="0.5"/>
  <g class="eg-sat1"><ellipse cx="-80" cy="20" rx="11" ry="9" fill="url(#egC_drop)" opacity="0.85"/><ellipse cx="-80" cy="20" rx="11" ry="9" fill="none" stroke="#88ffe0" stroke-width="0.6" opacity="0.5"/><ellipse cx="-83" cy="17" rx="3.5" ry="2" fill="#ffffff" opacity="0.8"/></g>
  <g class="eg-sat2"><ellipse cx="78" cy="-18" rx="14" ry="11" fill="url(#egC_drop)" opacity="0.85"/><ellipse cx="78" cy="-18" rx="14" ry="11" fill="none" stroke="#88ffe0" stroke-width="0.6" opacity="0.5"/><ellipse cx="74" cy="-22" rx="4" ry="2.5" fill="#ffffff" opacity="0.8"/></g>
  <g class="eg-wobble">
    <g class="eg-blob">
      <path d="M -70 -24 Q -84 6 -74 40 Q -54 72 -16 78 Q 26 82 56 68 Q 84 48 82 12 Q 86 -24 56 -46 Q 22 -62 -16 -58 Q -58 -56 -70 -24 Z" fill="#001a14" opacity="0.55" transform="translate(4 5)"/>
      <path d="M -70 -24 Q -84 6 -74 40 Q -54 72 -16 78 Q 26 82 56 68 Q 84 48 82 12 Q 86 -24 56 -46 Q 22 -62 -16 -58 Q -58 -56 -70 -24 Z" fill="url(#egC_gel)"/>
      <g class="eg-inner"><ellipse cx="4" cy="10" rx="34" ry="30" fill="url(#egC_core)"/></g>
      <path d="M -70 -24 Q -84 6 -74 40 Q -54 72 -16 78 Q 26 82 56 68 Q 84 48 82 12 Q 86 -24 56 -46 Q 22 -62 -16 -58 Q -58 -56 -70 -24 Z" fill="none" stroke="#88ffe0" stroke-width="1.2" opacity="0.6"/>
      <g class="eg-spec">
        <ellipse cx="-30" cy="-30" rx="22" ry="14" fill="#ffffff" opacity="0.75" transform="rotate(-30 -30 -30)"/>
        <ellipse cx="-14" cy="-14" rx="6" ry="4" fill="#ffffff" opacity="0.85" transform="rotate(-20 -14 -14)"/>
        <ellipse cx="18" cy="24" rx="12" ry="5" fill="#ffffff" opacity="0.25" transform="rotate(20 18 24)"/>
      </g>
    </g>
  </g>
  <g class="eg-sat3"><ellipse cx="68" cy="52" rx="9" ry="7" fill="url(#egC_drop)" opacity="0.9"/><ellipse cx="68" cy="52" rx="9" ry="7" fill="none" stroke="#88ffe0" stroke-width="0.5" opacity="0.55"/><ellipse cx="65" cy="50" rx="2.5" ry="1.5" fill="#ffffff" opacity="0.85"/></g>
</svg>`;

ENERGY_GEM_SVG.blossom = (function() {
  // The lotus — three rings of petals (outer / mid / inner), a stamen disc with ten pistils, a halo.
  // Built here so the ring loops stay on one line each; the final string is a plain SVG.
  const petal = (fill, strokeFill, rim, len, wid, tip) =>
    `<g>` +
      `<path d="M 0 0 Q -${wid} -${len*0.3} -${wid*0.85} -${len*0.65} Q 0 -${len} ${wid*0.85} -${len*0.65} Q ${wid} -${len*0.3} 0 0 Z" fill="${fill}"/>` +
      `<path d="M 0 0 Q -${wid} -${len*0.3} -${wid*0.85} -${len*0.65} Q 0 -${len} 0 0 Z" fill="${strokeFill}" opacity="0.6"/>` +
      `<path d="M 0 0 Q -${wid} -${len*0.3} -${wid*0.85} -${len*0.65} Q 0 -${len} ${wid*0.85} -${len*0.65} Q ${wid} -${len*0.3} 0 0 Z" fill="none" stroke="${rim}" stroke-width="0.9" opacity="0.65"/>` +
      `<line x1="0" y1="-${len*0.9}" x2="0" y2="-${len*0.08}" stroke="${tip}" stroke-width="1" opacity="0.6"/>` +
    `</g>`;
  const ring = (count, offset, len, wid, cls, gL, gD, rim, vein) => {
    let s = `<g class="${cls}">`;
    for (let i = 0; i < count; i++) s += `<g transform="rotate(${(offset + (360 / count) * i).toFixed(2)})">${petal(gL, gD, rim, len, wid, vein)}</g>`;
    return s + `</g>`;
  };
  let dots = "";
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = 16; dots += `<circle cx="${(Math.cos(a) * r).toFixed(2)}" cy="${(Math.sin(a) * r).toFixed(2)}" r="1.6" fill="#ffffcc"/>`; }
  return `
<svg viewBox="-110 -120 220 240" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="egB_outer" x1="0" y1="0" x2="0" y2="-1"><stop offset="0" stop-color="#881e55"/><stop offset="0.3" stop-color="#cc3380"/><stop offset="0.7" stop-color="#ff7ab8"/><stop offset="1" stop-color="#ffd0e8"/></linearGradient>
    <linearGradient id="egB_outerS" x1="1" y1="0" x2="0" y2="-1"><stop offset="0" stop-color="#660a3a"/><stop offset="0.5" stop-color="#99224e"/><stop offset="1" stop-color="#cc3380" stop-opacity="0.3"/></linearGradient>
    <linearGradient id="egB_mid" x1="0" y1="0" x2="0" y2="-1"><stop offset="0" stop-color="#99224e"/><stop offset="0.35" stop-color="#ee5599"/><stop offset="0.75" stop-color="#ffaacc"/><stop offset="1" stop-color="#ffeef5"/></linearGradient>
    <linearGradient id="egB_midS" x1="1" y1="0" x2="0" y2="-1"><stop offset="0" stop-color="#770a3a"/><stop offset="0.5" stop-color="#cc3380"/><stop offset="1" stop-color="#ee5599" stop-opacity="0.3"/></linearGradient>
    <linearGradient id="egB_inner" x1="0" y1="0" x2="0" y2="-1"><stop offset="0" stop-color="#cc3380"/><stop offset="0.3" stop-color="#ff99cc"/><stop offset="0.8" stop-color="#ffd8ea"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
    <linearGradient id="egB_innerS" x1="1" y1="0" x2="0" y2="-1"><stop offset="0" stop-color="#881e55"/><stop offset="0.5" stop-color="#ee5599"/><stop offset="1" stop-color="#ffaacc" stop-opacity="0.3"/></linearGradient>
    <radialGradient id="egB_stamen" cx="0.5" cy="0.5"><stop offset="0" stop-color="#ffffcc"/><stop offset="0.4" stop-color="#ffcc44"/><stop offset="1" stop-color="#cc8800"/></radialGradient>
    <radialGradient id="egB_stamenG" cx="0.5" cy="0.5"><stop offset="0" stop-color="#ffffff" stop-opacity="1"/><stop offset="0.5" stop-color="#ffdd88" stop-opacity="0.8"/><stop offset="1" stop-color="#ff7ab8" stop-opacity="0"/></radialGradient>
    <radialGradient id="egB_H" cx="0.5" cy="0.5"><stop offset="0" stop-color="#ff7ab8" stop-opacity="0.6"/><stop offset="1" stop-color="#330a22" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="0" cy="-5" rx="100" ry="100" fill="url(#egB_H)" opacity="0.55"/>
  <ellipse cx="4" cy="90" rx="38" ry="6" fill="#000" opacity="0.45"/>
  ${ring(8, 0, 104, 26, "eg-pO", "url(#egB_outer)", "url(#egB_outerS)", "#ffaacc", "#ffeef5")}
  ${ring(7, 25.7, 84, 22, "eg-pM", "url(#egB_mid)", "url(#egB_midS)", "#ffcce0", "#ffffff")}
  ${ring(5, 36, 58, 18, "eg-pI", "url(#egB_inner)", "url(#egB_innerS)", "#ffffff", "#ffffff")}
  <g class="eg-cglow"><circle cx="0" cy="0" r="28" fill="url(#egB_stamenG)"/></g>
  <circle cx="0" cy="0" r="12" fill="url(#egB_stamen)"/>
  <circle cx="0" cy="0" r="12" fill="none" stroke="#ffcc44" stroke-width="0.8" opacity="0.7"/>
  <g>${dots}</g>
  <circle cx="0" cy="0" r="3" fill="#ffffff"/>
</svg>`;
})();

// ─── dynamic gems: flux (counter-rotating pyramids) and toxic (bubble with half-bubbles) ──────
// Each entry registers with a shared rAF loop (`_energyGemFx`), which pauses under a pack's reveal
// (as the old plasma did, game.html `#cardsRoot:has(.cr-overlay)`) and respects reduced motion.
const _ENERGY_GEM_FX = new Set();
let _energyGemFxRunning = false;

function _energyGemReducedMotion() {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function _energyGemPaused() {
    // The pack's reveal overlay sits in #cardsRoot .cr-overlay — a card outside it should pause.
    const root = typeof document !== "undefined" ? document : null; if (!root) return false;
    const overlay = root.querySelector("#cardsRoot .cr-overlay");
    return !!overlay;   // (while a reveal is up, non-reveal cards hold still)
}

function _energyGemFxLoop(tms) {
    const t = tms / 1000;
    const paused = _energyGemPaused(), reduced = _energyGemReducedMotion();
    for (const entry of [..._ENERGY_GEM_FX]) {
        if (!entry.svg.isConnected) { _ENERGY_GEM_FX.delete(entry); continue; }
        // In the reveal, pause only cards OUTSIDE the overlay; a card INSIDE it keeps running.
        const inOverlay = !!entry.svg.closest(".cr-overlay");
        if (reduced) { entry.render(0, entry); continue; }
        if (paused && !inOverlay) { continue; }   // (hold its last frame)
        entry.render(t, entry);
    }
    if (_ENERGY_GEM_FX.size > 0) requestAnimationFrame(_energyGemFxLoop);
    else _energyGemFxRunning = false;
}
function _energyGemFxRegister(entry) {
    _ENERGY_GEM_FX.add(entry);
    if (!_energyGemFxRunning) { _energyGemFxRunning = true; requestAnimationFrame(_energyGemFxLoop); }
}

// Flux — two triangular pyramids base-to-base, spinning together and gyrating. Every face is a
// polygon whose vertices are recomputed and sorted each frame; its fill is a Lambert shade.
const _EG_FLUX_PE = 260, _EG_FLUX_LIGHT = (function(){ const v=[-0.4,-0.6,0.7]; const l=Math.hypot(v[0],v[1],v[2]); return [v[0]/l,v[1]/l,v[2]/l]; })();
function _egFluxTransform(x, y, z, spin, tumble, sway) {
    let c = Math.cos(spin), s = Math.sin(spin);
    let x1 = x*c + z*s, y1 = y, z1 = -x*s + z*c;
    c = Math.cos(tumble); s = Math.sin(tumble);
    const y2 = y1*c - z1*s, z2 = y1*s + z1*c, x2 = x1;
    c = Math.cos(sway); s = Math.sin(sway);
    return [x2*c - y2*s, x2*s + y2*c, z2];
}
function _egFluxProject(p) { const k = _EG_FLUX_PE / (_EG_FLUX_PE - p[2]); return [p[0]*k, p[1]*k]; }
function _egFluxNormal(a, b, c) {
    const e1 = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], e2 = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
    const n = [ e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0] ];
    const l = Math.hypot(n[0], n[1], n[2]); return [n[0]/l, n[1]/l, n[2]/l];
}
function _egFluxShade(n) { const d = n[0]*_EG_FLUX_LIGHT[0] + n[1]*_EG_FLUX_LIGHT[1] + n[2]*_EG_FLUX_LIGHT[2]; return Math.max(0.08, Math.min(1, d)); }

function _energyGemFlux(container) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "-100 -120 200 240"); svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const defs = document.createElementNS(NS, "defs");
    defs.innerHTML =
        `<radialGradient id="egX_H" cx="0.5" cy="0.5"><stop offset="0" stop-color="#cc44ff" stop-opacity="0.55"/><stop offset="1" stop-color="#330066" stop-opacity="0"/></radialGradient>` +
        `<radialGradient id="egX_I" cx="0.5" cy="0.5"><stop offset="0" stop-color="#ffccff" stop-opacity="1"/><stop offset="0.5" stop-color="#cc44ff" stop-opacity="0.7"/><stop offset="1" stop-color="#9933ff" stop-opacity="0"/></radialGradient>`;
    svg.appendChild(defs);
    const halo = document.createElementNS(NS, "ellipse");
    halo.setAttribute("cx", "0"); halo.setAttribute("cy", "0"); halo.setAttribute("rx", "70"); halo.setAttribute("ry", "100"); halo.setAttribute("fill", "url(#egX_H)");
    svg.appendChild(halo);
    const shadow = document.createElementNS(NS, "ellipse");
    shadow.setAttribute("cx", "4"); shadow.setAttribute("cy", "90"); shadow.setAttribute("rx", "32"); shadow.setAttribute("ry", "5"); shadow.setAttribute("fill", "#000"); shadow.setAttribute("opacity", "0.5");
    svg.appendChild(shadow);
    const join = document.createElementNS(NS, "ellipse");
    join.setAttribute("cx", "0"); join.setAttribute("cy", "0"); join.setAttribute("rx", "28"); join.setAttribute("ry", "10"); join.setAttribute("fill", "url(#egX_I)");
    svg.appendChild(join);
    const faces = [];
    for (let i = 0; i < 6; i++) {
        const p = document.createElementNS(NS, "polygon");
        p.setAttribute("stroke", "#eeccff"); p.setAttribute("stroke-width", "0.6"); p.setAttribute("stroke-opacity", "0.7"); p.setAttribute("stroke-linejoin", "miter");
        faces.push(p); svg.appendChild(p);
    }
    container.appendChild(svg);

    const R = 55, H = 78, GAP = 3;
    const entry = { svg, render: function(t) {
        const spin = t * 0.9, tumble = Math.sin(t * 0.45) * 0.55, sway = Math.sin(t * 0.27 + 1.3) * 0.35;
        const a0 = 0, a1 = Math.PI * 2 / 3, a2 = Math.PI * 4 / 3;
        const topBase = [a0,a1,a2].map(a => _egFluxTransform(R*Math.cos(a), -GAP/2, R*Math.sin(a), spin, tumble, sway));
        const topApex = _egFluxTransform(0, -H, 0, spin, tumble, sway);
        const botBase = [a0,a1,a2].map(a => _egFluxTransform(R*Math.cos(a),  GAP/2, R*Math.sin(a), spin, tumble, sway));
        const botApex = _egFluxTransform(0, H, 0, spin, tumble, sway);
        const descs = [];
        for (let i = 0; i < 3; i++) {
            const v0 = topBase[i], v1 = topBase[(i+1) % 3], v2 = topApex;
            const n = _egFluxNormal(v0, v1, v2), s = _egFluxShade(n), avgZ = (v0[2]+v1[2]+v2[2])/3;
            descs.push({ v0, v1, v2, n, s, avgZ });
        }
        for (let i = 0; i < 3; i++) {
            const v0 = botBase[i], v1 = botBase[(i+1) % 3], v2 = botApex;
            const n = _egFluxNormal(v0, v1, v2), s = _egFluxShade(n), avgZ = (v0[2]+v1[2]+v2[2])/3;
            descs.push({ v0, v1, v2, n, s, avgZ });
        }
        descs.sort(function(a, b){ return a.avgZ - b.avgZ; });
        for (let i = 0; i < 6; i++) {
            const d = descs[i], el = faces[i];
            const p0 = _egFluxProject(d.v0), p1 = _egFluxProject(d.v1), p2 = _egFluxProject(d.v2);
            el.setAttribute("points", p0[0].toFixed(2)+","+p0[1].toFixed(2)+" "+p1[0].toFixed(2)+","+p1[1].toFixed(2)+" "+p2[0].toFixed(2)+","+p2[1].toFixed(2));
            el.setAttribute("fill", "hsl(275 85% " + (10 + d.s * 55).toFixed(1) + "%)");
            el.style.display = d.n[2] > 0 ? "" : "none";   // (back-face cull: a face whose normal is away from the camera is hidden)
        }
    } };
    entry.render(0);
    _energyGemFxRegister(entry);
}

// Toxic — a green bubble (the old core design) with eight half-bubbles welling up on its surface,
// spinning + gyrating. Each half-bubble has a fixed point on the sphere; its on-screen position and
// size come from the sphere's rotation.
const _EG_TOX_PE = 260;
function _egToxTransform(x, y, z, spin, tumble, sway) { return _egFluxTransform(x, y, z, spin, tumble, sway); }
function _egToxProject(p) { const k = _EG_TOX_PE / (_EG_TOX_PE - p[2]); return [p[0]*k, p[1]*k, k]; }
function _energyGemToxic(container) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "-100 -120 200 240"); svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const defs = document.createElementNS(NS, "defs");
    defs.innerHTML =
        `<radialGradient id="egT_main" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="0.12" stop-color="#ddffcc" stop-opacity="0.85"/><stop offset="0.45" stop-color="#55cc33" stop-opacity="0.55"/><stop offset="0.85" stop-color="#1a4408" stop-opacity="0.65"/><stop offset="1" stop-color="#0a1800" stop-opacity="0.9"/></radialGradient>` +
        `<radialGradient id="egT_little" cx="0.3" cy="0.25" r="0.75"><stop offset="0" stop-color="#ffffff" stop-opacity="1"/><stop offset="0.15" stop-color="#ddffcc" stop-opacity="0.9"/><stop offset="0.5" stop-color="#55cc33" stop-opacity="0.7"/><stop offset="1" stop-color="#1a4408" stop-opacity="0.95"/></radialGradient>` +
        `<radialGradient id="egT_H" cx="0.5" cy="0.5"><stop offset="0" stop-color="#66ff66" stop-opacity="0.55"/><stop offset="1" stop-color="#002200" stop-opacity="0"/></radialGradient>` +
        `<radialGradient id="egT_I" cx="0.5" cy="0.5"><stop offset="0" stop-color="#ffffff" stop-opacity="1"/><stop offset="0.4" stop-color="#aaff55" stop-opacity="0.8"/><stop offset="1" stop-color="#66ff66" stop-opacity="0"/></radialGradient>`;
    svg.appendChild(defs);
    const halo = document.createElementNS(NS, "ellipse");
    halo.setAttribute("cx", "0"); halo.setAttribute("cy", "0"); halo.setAttribute("rx", "95"); halo.setAttribute("ry", "100"); halo.setAttribute("fill", "url(#egT_H)");
    svg.appendChild(halo);
    const shadow = document.createElementNS(NS, "ellipse");
    shadow.setAttribute("cx", "4"); shadow.setAttribute("cy", "95"); shadow.setAttribute("rx", "36"); shadow.setAttribute("ry", "6"); shadow.setAttribute("fill", "#000"); shadow.setAttribute("opacity", "0.55");
    svg.appendChild(shadow);
    const backGrp = document.createElementNS(NS, "g"); svg.appendChild(backGrp);
    const main = document.createElementNS(NS, "circle");
    main.setAttribute("cx", "0"); main.setAttribute("cy", "0"); main.setAttribute("r", "58"); main.setAttribute("fill", "url(#egT_main)");
    svg.appendChild(main);
    const mainRim = document.createElementNS(NS, "circle");
    mainRim.setAttribute("cx", "0"); mainRim.setAttribute("cy", "0"); mainRim.setAttribute("r", "58"); mainRim.setAttribute("fill", "none"); mainRim.setAttribute("stroke", "#aaff77"); mainRim.setAttribute("stroke-width", "1"); mainRim.setAttribute("opacity", "0.5");
    svg.appendChild(mainRim);
    const spec = document.createElementNS(NS, "ellipse");
    spec.setAttribute("cx", "-22"); spec.setAttribute("cy", "-26"); spec.setAttribute("rx", "16"); spec.setAttribute("ry", "8"); spec.setAttribute("fill", "#ffffff"); spec.setAttribute("opacity", "0.55"); spec.setAttribute("transform", "rotate(-30 -22 -26)");
    svg.appendChild(spec);
    const frontGrp = document.createElementNS(NS, "g"); svg.appendChild(frontGrp);
    const nuc = document.createElementNS(NS, "circle");
    nuc.setAttribute("cx", "0"); nuc.setAttribute("cy", "0"); nuc.setAttribute("r", "14"); nuc.setAttribute("fill", "url(#egT_I)");
    svg.appendChild(nuc);
    container.appendChild(svg);

    const R = 58;
    const bubbles = [
        { phi: 0.4, theta: 0.6, r: 22 }, { phi: 1.6, theta: 1.0, r: 17 },
        { phi: 2.6, theta: 0.5, r: 20 }, { phi: 3.5, theta: 1.4, r: 15 },
        { phi: 4.3, theta: 0.9, r: 19 }, { phi: 5.3, theta: 1.3, r: 16 },
        { phi: 2.0, theta: 2.3, r: 18 }, { phi: 4.7, theta: 2.2, r: 14 },
    ];
    const elems = bubbles.map(function(){
        const g = document.createElementNS(NS, "g");
        const c = document.createElementNS(NS, "circle"); c.setAttribute("fill", "url(#egT_little)");
        const rim = document.createElementNS(NS, "circle"); rim.setAttribute("fill", "none"); rim.setAttribute("stroke", "#aaff77"); rim.setAttribute("stroke-width", "0.8");
        g.appendChild(c); g.appendChild(rim); return { g, c, rim };
    });

    const entry = { svg, render: function(t) {
        const spin = t * 0.5, tumble = Math.sin(t * 0.4) * 0.55, sway = Math.sin(t * 0.25 + 1.2) * 0.4;
        const items = bubbles.map(function(b, i) {
            const x = R * Math.sin(b.theta) * Math.cos(b.phi);
            const y = R * Math.cos(b.theta);
            const z = R * Math.sin(b.theta) * Math.sin(b.phi);
            const p = _egToxTransform(x, y, z, spin, tumble, sway);
            const pr = _egToxProject(p);
            return { idx: i, z: p[2], sx: pr[0], sy: pr[1], scale: pr[2], r: b.r };
        });
        items.sort(function(a, b){ return a.z - b.z; });
        while (backGrp.firstChild) backGrp.removeChild(backGrp.firstChild);
        while (frontGrp.firstChild) frontGrp.removeChild(frontGrp.firstChild);
        for (let i = 0; i < items.length; i++) {
            const it = items[i], el = elems[it.idx];
            const r = it.r * it.scale * 0.95;
            el.c.setAttribute("cx", it.sx.toFixed(2)); el.c.setAttribute("cy", it.sy.toFixed(2)); el.c.setAttribute("r", r.toFixed(2));
            el.rim.setAttribute("cx", it.sx.toFixed(2)); el.rim.setAttribute("cy", it.sy.toFixed(2)); el.rim.setAttribute("r", r.toFixed(2));
            if (it.z <= 0) {
                el.c.setAttribute("opacity", "0.95"); el.rim.setAttribute("opacity", "0.55");
                frontGrp.appendChild(el.g);
            } else {
                const fade = 1 - Math.min(1, it.z / R);
                el.c.setAttribute("opacity", (0.35 * fade).toFixed(2));
                el.rim.setAttribute("opacity", (0.25 * fade).toFixed(2));
                backGrp.appendChild(el.g);
            }
        }
    } };
    entry.render(0);
    _energyGemFxRegister(entry);
}

// ─── public: put the right gem into an energy card's .cd-en (js/cardsui.js _cdSlab) ─────────
function energyGemInit(container, el) {
    if (!container) return;
    const html = ENERGY_GEM_SVG[el];
    if (html) { container.innerHTML = html; return; }
    if (el === "flux") { _energyGemFlux(container); return; }
    if (el === "toxic") { _energyGemToxic(container); return; }
    // (every other value, including NO_ELEMENT, leaves the container empty: such an energy card is not dealt)
}
