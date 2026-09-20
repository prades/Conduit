// ─────────────────────────────────────────────────────────
//  PYLON CODEX — what each element actually does
//
//  A pylon on its own is inert. Upgrading one infuses it with an element and
//  puts it in a mode; two or more pylons of the SAME element within range link
//  into a network, and it is the network that produces the zone effect along
//  the line between them.
//
//  Every number below is taken from the live effect code in game.js. There is a
//  test (tests/codex.js) that reads those numbers back out of game.js and fails
//  if this text and the implementation ever drift apart — so if you change a
//  tier value, change it here too.
// ─────────────────────────────────────────────────────────

// Network tier is decided by the size of the largest connected same-element
// group: 2+ pylons = I, 4+ = II, 6+ = III.
const CODEX_TIER_SIZES = { 1: 2, 2: 4, 3: 6 };

const CODEX_GENERAL = [
    { h: 'HOW PYLONS WORK' },
    { t: 'A dormant pylon does nothing. UPGRADE one to infuse it with an element — a follower sacrifices itself to power it.' },
    { t: 'ATTACK MODE makes it a turret that shoots nearby enemies on its own.' },
    { t: 'WAVE MODE links it to other pylons of the SAME element within 3 tiles, and the effect plays out along the line between them.' },
    { t: 'Chains are fine. Links that would just close a loop are skipped, so the network stays a tree.' },
    null,
    { h: 'NETWORK TIERS' },
    { t: 'The largest connected group of one element sets that element\'s tier. Bigger network, stronger effect.' },
    ['TIER I',   '2+ pylons', '#8fa'],
    ['TIER II',  '4+ pylons', '#8fa'],
    ['TIER III', '6+ pylons', '#8fa'],
    null,
    { h: 'SEASONED' },
    { t: 'A pylon that survives a wave becomes seasoned. One seasoned pylon in a network multiplies its damage, shields and pull by 1.25.' },
];

// Each entry: what the element is for, then what each tier adds.
const CODEX_ELEMENTS = {
    fire: {
        role: 'DAMAGE',
        summary: 'Burns anything hostile standing in the network zone. The straightforward damage option.',
        tiers: {
            1: '6 damage every half second.',
            2: '10 damage, and faster — every 0.4s.',
            3: '15 damage every 0.3s. Each hit has a 35% chance to ignite, spreading 4 damage to enemies within 1.5 tiles.',
        },
        numbers: { dmg: [6, 10, 15] },
    },
    ice: {
        role: 'CONTROL',
        summary: 'Slows anything hostile in the zone to a crawl. Buys your followers time rather than killing.',
        tiers: {
            1: 'Enemies move at 35% speed.',
            2: '20% speed, with a small chance each moment to freeze one solid.',
            3: 'Deep freeze — 8% speed, plus 4 ice damage every second.',
        },
        numbers: { slow: [0.35, 0.20, 0.08] },
    },
    electric: {
        role: 'SUPPORT',
        summary: 'Charges your own side instead of hurting theirs. Feeds resonance to allies in the zone.',
        tiers: {
            1: '+2 resonance to every ally, six times a second.',
            2: '+4 resonance, and ultimate charge builds faster.',
            3: '+6 resonance, and ultimates charge faster still.',
        },
        numbers: { gain: [2, 4, 6] },
    },
    core: {
        role: 'DEFENCE',
        summary: 'Wraps allies in the zone in a regenerating shield that soaks damage before health does.',
        tiers: {
            1: '+3 shield each second, up to 20.',
            2: '+5 shield, up to 35, and applied more often.',
            3: '+8 shield, up to 50, and broken shields repair themselves.',
        },
        numbers: { gain: [3, 5, 8], cap: [20, 35, 50] },
    },
    flux: {
        role: 'CONTROL',
        summary: 'Drags enemies toward the middle of the link. Use it to pull a wave off your Crystal and bunch it up for something else to hit.',
        tiers: {
            1: 'Steady pull toward the midpoint.',
            2: 'Stronger pull, and dragged enemies drag their neighbours along.',
            3: 'Vortex — strongest pull, plus 3 damage every half second to anything caught.',
        },
        numbers: { pull: [0.10, 0.15, 0.20] },
    },
    toxic: {
        role: 'DAMAGE',
        summary: 'Poisons and strips armour. Lower damage than fire, but it makes everything else hit harder.',
        tiers: {
            1: '5 damage every 0.7s, 30% chance to shred defence.',
            2: '8 damage every 0.5s, 50% chance to shred, and the shred bites deeper.',
            3: '12 damage every 0.3s, 60% chance to shred, and the cloud spreads the shred to enemies within 1.5 tiles.',
        },
        numbers: { dmg: [5, 8, 12] },
    },
};

// Elements with an extra rule that does not fit the tier table.
const CODEX_NOTES = {
    core: 'Three or more CORE pylons also enclose a zone around their centre that tops up any shield already running.',
};

// ── Text wrapping ────────────────────────────────────────
// The panel is monospace, so a character budget is exact rather than a guess.
function codexWrap(text, maxChars) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
        if (!line.length) { line = w; continue; }
        if (line.length + 1 + w.length <= maxChars) { line += ' ' + w; }
        else { lines.push(line); line = w; }
    }
    if (line.length) lines.push(line);
    return lines.length ? lines : [''];
}

// Build the rows for the codex index — one entry per element.
function codexIndexRows(maxChars) {
    const w = maxChars || 48;
    const rows = [];
    // No PYLON CODEX heading here — the panel title already says it.
    codexWrap('Tap an element to read what its pylon network does.', w)
        .forEach(l => rows.push({ t: l, c: '#aad' }));
    rows.push(null);
    ELEMENTS.forEach(el => {
        const entry = CODEX_ELEMENTS[el.id];
        if (!entry) return;
        rows.push([el.label.toUpperCase(), entry.role, el.color, { codexElement: el.id }]);
    });
    rows.push(null);
    // The general rules live on their own page. Appending them here made the
    // index tall enough to run off the top and bottom of a phone screen.
    rows.push(['GENERAL RULES', 'HOW IT WORKS', '#0c9', { codexPage: 'rules' }]);
    return rows;
}

// Build the rows for the general-rules page.
function codexRulesRows(maxChars) {
    const w = maxChars || 48;
    const rows = [];
    // Authored as prose, so it has to be wrapped here — left raw it pushed
    // straight through the panel border.
    CODEX_GENERAL.forEach(r => {
        if (r === null || Array.isArray(r) || r.h !== undefined) { rows.push(r); return; }
        codexWrap(r.t, w).forEach(l => rows.push({ t: l, c: r.c }));
    });
    return rows;
}

// Build the rows for one element's detail page.
function codexElementRows(elementId, maxChars) {
    const el = ELEMENTS.find(e => e.id === elementId);
    const entry = CODEX_ELEMENTS[elementId];
    if (!el || !entry) return [{ t: 'No codex entry for this element.' }];
    const rows = [{ h: el.label.toUpperCase() + ' PYLON — ' + entry.role }];
    codexWrap(entry.summary, maxChars).forEach(l => rows.push({ t: l, c: '#aad' }));
    rows.push(null);
    for (const tier of [1, 2, 3]) {
        rows.push({ h: 'TIER ' + ['', 'I', 'II', 'III'][tier] + '  (' + CODEX_TIER_SIZES[tier] + '+ linked)', c: el.color });
        codexWrap(entry.tiers[tier], maxChars).forEach(l => rows.push({ t: l, c: '#9bb' }));
    }
    if (CODEX_NOTES[elementId]) {
        rows.push(null);
        codexWrap(CODEX_NOTES[elementId], maxChars).forEach(l => rows.push({ t: l, c: '#7a9' }));
    }
    return rows;
}

// ── INLINE PYLON EXPLANATION ─────────────────────────────
// The info panel used to report ELEMENT: FIRE and stop there, which told the
// player nothing about what fire actually does. These rows go straight into
// that panel so the answer is where the question is asked, rather than behind
// a button to a separate reference.
function codexPylonRows(elementId, maxChars, currentTier) {
    const el    = ELEMENTS.find(e => e.id === elementId);
    const entry = CODEX_ELEMENTS[elementId];
    if (!el || !entry) return [];
    const w = maxChars || 48;
    const rows = [null, { h: el.label.toUpperCase() + ' NETWORK — ' + entry.role, c: el.color }];
    codexWrap(entry.summary, w).forEach(l => rows.push({ t: l, c: '#aad' }));
    for (const tier of [1, 2, 3]) {
        const active = currentTier === tier;
        rows.push({
            h: 'TIER ' + ['', 'I', 'II', 'III'][tier] + ' (' + CODEX_TIER_SIZES[tier] + '+)' +
               (active ? '   \u25c0 ACTIVE' : ''),
            c: active ? el.color : '#5b6b62',
        });
        codexWrap(entry.tiers[tier], w).forEach(l => rows.push({ t: l, c: active ? '#cfe3dd' : '#6f7d76' }));
    }
    return rows;
}

// Shown for a pylon with no element yet, so the panel still answers "what is
// this for" instead of listing six stats and stopping.
function codexDormantPylonRows(maxChars) {
    const w = maxChars || 48;
    const rows = [null, { h: 'NOT INFUSED', c: '#9a8' }];
    codexWrap('Dormant. UPGRADE it to infuse an element — a follower is spent to power it — then pick ATTACK or WAVE mode.', w)
        .forEach(l => rows.push({ t: l, c: '#9ab' }));
    codexWrap('PYLON CODEX below compares what every element does.', w)
        .forEach(l => rows.push({ t: l, c: '#6a7a72' }));
    return rows;
}
