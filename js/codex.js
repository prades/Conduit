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

// The generator gets its own page rather than a block on the rules page: that
// page was already at 24 of its 25-row budget, and five more entries ran it
// off the bottom of a phone screen.
const CODEX_GENERATOR = [
    { h: 'GENERATOR — NEUTRAL' },
    { t: 'No element, no tier, no wave zone. It joins no elemental network and contributes nothing to one.' },
    null,
    { h: 'IT MENDS PYLONS' },
    { t: 'Every friendly pylon in range is repaired, whatever its element.' },
    ['REPAIR', GENERATOR_HEAL_AMOUNT + ' HP / ' + (GENERATOR_HEAL_INTERVAL / 60).toFixed(1) + 's', '#8fa'],
    { t: 'It will NOT rebuild a broken pylon. Wreckage is a CORE worker\'s job.' },
    null,
    { h: 'IT LINKS THE NEST' },
    { t: 'A generator is the only structure a broken nest will connect to. No elemental pylon can take that link.' },
    { t: 'Because of that, it can only be built near a nest — and only a generator inside that range can take the link.' },
    ['MAX RANGE', GENERATOR_NEST_RANGE + ' tiles from a nest', '#8fa'],
];

// Infestation gets its own page too. The important line is the last one: the
// player needs to know RECLAIM exists, or a converted pylon looks permanent.
const CODEX_INFEST = [
    { h: 'IF YOU LEAVE THEM ALONE' },
    { t: 'An undisturbed predator walks to your nearest pylon and starts chewing it over to its side.' },
    ['CONVERSION', (1 / INFEST_RATE / 60).toFixed(0) + 's of contact', '#f88'],
    { t: 'A bar shows it happening. Interrupt the predator and the pylon recovers on its own.' },
    null,
    { h: 'WHAT GROWS THERE' },
    { t: 'A taken pylon gets a cocoon. It swells to a ' + COCOON_SPAN_MAX + 'x' + COCOON_SPAN_MAX + ' square and takes your pylons inside it.' },
    ['NESTS GROW', '1 per zone, 1 per ' + (NEST_GROW_COOLDOWN / 60).toFixed(0) + 's map-wide', '#ff7744'],
    ['HATCHES', 'one predator every ' + (COCOON_SPAWN_FRAMES / 60).toFixed(0) + 's', '#f88'],
    { t: 'What hatches is the same species and class as whatever spun it.' },
    null,
    { h: 'TOXIN' },
    // "and recruits" was left behind when recruits stopped taking any damage at
    // all on their way in. Nothing read it against puddleAffects, so the page
    // went on promising something the code had stopped doing.
    { t: 'Only ' + COCOON_TOXIN_SPECIES.join(' and ').toUpperCase() + ' leave any, on one tile beside the pylon. It burns followers only.' },
    ['TOXIN', COCOON_PUDDLE_DAMAGE + ' damage / ' + (COCOON_PUDDLE_INTERVAL / 60).toFixed(2).replace(/0$/, '') + 's', '#7fdd44'],
    null,
    { h: 'TAKING IT BACK' },
    { t: 'Long-press a red pylon and pick RECLAIM. A crew rebuilds it and the cocoon and nest die with it. If the crew dies, order it again — UPGRADE will not do, it is not yours yet.' },
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

// The infestation page.
function codexInfestRows(maxChars) {
    const w = maxChars || 48;
    const rows = [];
    CODEX_INFEST.forEach(r => {
        if (r === null || Array.isArray(r) || r.h !== undefined) { rows.push(r); return; }
        codexWrap(r.t, w).forEach(l => rows.push({ t: l, c: '#aad' }));
    });
    return rows;
}

// The generator's own page.
function codexGeneratorRows(maxChars) {
    const w = maxChars || 48;
    const rows = [];
    CODEX_GENERATOR.forEach(r => {
        if (r === null || Array.isArray(r) || r.h !== undefined) { rows.push(r); return; }
        codexWrap(r.t, w).forEach(l => rows.push({ t: l, c: '#aad' }));
    });
    return rows;
}

// Build the rows for the codex index — one entry per element, then the
// neutral pylon, then the general rules page.
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
    // The neutral pylon sits under the six elements, because that is where a
    // player looking for "what can I put on a pylon" will be looking.
    rows.push([GENERATOR_LABEL, 'NEUTRAL \u00b7 REPAIR', GENERATOR_COLOR, { codexPage: 'generator' }]);
    rows.push(['INFESTATION', 'WHAT THEY DO', '#f77', { codexPage: 'infest' }]);
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

// ─────────────────────────────────────────────────────────
//  GAME INDEX (the ? panel) — PYLON ELEMENT EFFECTS
// ─────────────────────────────────────────────────────────
// The index had a PYLONS page covering modes, tiers, integrity and nests, but
// never said what a FIRE network actually does as opposed to an ICE one. This
// fills that in from the same table the in-world info panel uses, so the two
// can never disagree with each other or with game.js.
function _codexEsc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderPylonIndex() {
    if (typeof document === 'undefined') return;

    const host = document.getElementById('cmPylonElements');
    if (host) {
        let html = '';
        ELEMENTS.forEach((el, i) => {
            const e = CODEX_ELEMENTS[el.id];
            if (!e) return;
            if (i > 0) html += '<hr class="cm-hr">';
            html +=
                '<div class="cm-elem-head">' +
                  '<span class="cm-elem-dot" style="background:' + el.color +
                    ';box-shadow:0 0 5px ' + el.color + '"></span>' +
                  '<span style="color:' + el.color + '">' + _codexEsc(el.label.toUpperCase()) + '</span>' +
                  '<span class="cm-dim" style="margin-left:auto;font-size:0.68rem">' +
                    _codexEsc(e.role) + '</span>' +
                '</div>' +
                '<div class="ctrl-row cm-dim" style="margin-bottom:4px">' + _codexEsc(e.summary) + '</div>';
            for (const tier of [1, 2, 3]) {
                html +=
                    '<div class="cm-tier"><span class="cm-tier-badge">T' + tier + '</span> ' +
                    '<span style="color:#aad">' + CODEX_TIER_SIZES[tier] + '+ pylons — ' +
                    _codexEsc(e.tiers[tier]) + '</span></div>';
            }
            if (CODEX_NOTES[el.id]) {
                html += '<div class="cm-tip">' + _codexEsc(CODEX_NOTES[el.id]) + '</div>';
            }
        });
        host.innerHTML = html;
    }

    const net = document.getElementById('cmPylonNetwork');
    if (net) {
        // The old copy said "within 5 tiles" and credited tier II with a +15%
        // ultimate bonus, neither of which the code does. Generated from the
        // real constants instead.
        const base  = (typeof PYLON_LINK_TILES === 'number') ? PYLON_LINK_TILES : 3;
        const relay = (typeof PYLON_LINK_TILES_RELAY === 'number') ? PYLON_LINK_TILES_RELAY : 5;
        let html =
            '<div class="ctrl-row cm-dim" style="margin-bottom:5px">Same-element pylons within ' +
            '<span class="cm-stat">' + base + ' tiles</span> auto-connect (' +
            '<span class="cm-stat">' + relay + '</span> with the Signal Relay). ' +
            'The largest connected group sets that element\'s tier.</div>';
        for (const tier of [1, 2, 3]) {
            html += '<div class="cm-tier"><span class="cm-tier-badge">T' + tier + '</span> ' +
                    '<span style="color:#aad">' + CODEX_TIER_SIZES[tier] +
                    '+ pylons — see the element table above for what this tier does.</span></div>';
        }
        net.innerHTML = html;
    }
}

// ── GAME INDEX — FIGHTERS & WORKERS ──────────────────────
// Documents the charged-mass chain on the followers page, generated from the
// constants in js/mass.js so the text cannot drift from the behaviour.
function renderWorkCrewIndex() {
    if (typeof document === 'undefined') return;
    const host = document.getElementById('cmWorkCrew');
    if (!host) return;
    const secs = (typeof MASS_NEUTRALISE_FRAMES === 'number')
        ? (MASS_NEUTRALISE_FRAMES / 60).toFixed(1) : '2';
    const pct  = (typeof MASS_VALUE_SCALE === 'number')
        ? Math.round(MASS_VALUE_SCALE * 100) : 35;
    const cocoonSecs = (typeof SCOUR_COCOON_FRAMES === 'number')
        ? Math.round(SCOUR_COCOON_FRAMES / 60) : 15;
    const nestSecs = (typeof SCOUR_NEST_FRAMES === 'number')
        ? Math.round(SCOUR_NEST_FRAMES / 60) : 25;
    // The cloud is stated as a diameter, which is what the player sees; the
    // constant is a radius.
    const repelR = (typeof REPEL_RADIUS === 'number')
        ? (REPEL_RADIUS * 2).toFixed(1).replace(/\.0$/, '') : '5';
    // Read off the list rather than spelled out, so adding a fifth worker
    // element cannot leave this page naming four.
    const whoCanWork = (typeof workerElements === 'function' ? workerElements() : [])
        .map(e => '<span class="cm-stat">' + e.toUpperCase() + '</span>');
    const whoText = whoCanWork.length
        ? whoCanWork.slice(0, -1).join(', ') + ' and ' + whoCanWork[whoCanWork.length - 1]
        : 'nothing';
    host.innerHTML =
        '<div class="cm-intro-box">Every predator you kill leaves a lump of ' +
        '<strong>charged mass</strong>. It is not a pickup — walking over it does nothing. ' +
        'Two jobs have to be done before it is worth anything, and only followers on ' +
        '<strong>worker</strong> duty will do them.</div>' +

        '<div class="cm-build-row"><span class="cm-build-label">Assign</span>' +
        'Long-press one of your own followers \u2192 radial UP \u2192 TO WORK / TO LINE. ' +
        'Changing duty <strong>releases a standing POSITION order</strong> \u2014 a post is not a ' +
        'task and never finishes on its own, so it would otherwise keep the unit off work for good. ' +
        'A real task in progress is left to finish.</div>' +
        '<div class="cm-build-row"><span class="cm-build-label">Fighters</span>' +
        'Behave exactly as before. Every follower starts as one.</div>' +
        '<div class="cm-build-row"><span class="cm-build-label">Workers</span>' +
        'Ignore combat and do one job each. Only ' + whoText + ' can — ' +
        'nothing else has a job to do.</div>' +

        '<div class="cm-ability"><strong>1. Neutralise \u2014 ELECTRIC:</strong> stands on a charged lump and ' +
        'bleeds the charge off over about <span class="cm-stat">' + secs + 's</span>. Until then it just crackles.</div>' +
        '<div class="cm-ability"><strong>2. Haul \u2014 FLUX:</strong> drags an inert lump back to the Crystal, ' +
        'where it pays out as shards. Kill the carrier and the lump drops where it fell.</div>' +
        '<div class="cm-ability"><strong>Repair \u2014 CORE:</strong> a pylon that loses its health is not gone, ' +
        'it is <strong>broken</strong> — it keeps its tile, its element and its mode. A core worker rebuilds it ' +
        'in place, exactly as it was. Nothing else can.</div>' +
        '<div class="cm-ability"><strong>Scour — FIRE:</strong> burns back what an infestation leaves on ' +
        'the ground. It takes the worst thing in reach first: a <strong>toxin patch</strong>, then a ' +
        '<strong>grown nest</strong> (about <span class="cm-stat">' + nestSecs + 's</span>), then the ' +
        '<strong>cocoon</strong> (about <span class="cm-stat">' + cocoonSecs + 's</span>). Two scourers on the ' +
        'same thing are twice as quick, and the toxin does not hurt a fire follower. Scouring stops the ' +
        'hatching — it does <em>not</em> hand the pylon back, which still takes a RECLAIM.</div>' +
        '<div class="cm-ability"><strong>Repel — TOXIC:</strong> a cloud <span class="cm-stat">' +
        repelR + ' tiles</span> across that nothing hostile can stand in. It does <strong>no damage ' +
        'at all</strong> — what it buys you is <strong>ground</strong>. The shove is strongest at the ' +
        'middle and fades to nothing at the rim, and it beats a predator’s walking speed, so one ' +
        'parked on a pylon keeps them off it without ever winning a fight. Recruits walking to the ' +
        'Crystal are never pushed.</div>' +
        '<div class="cm-ability"><strong>Set a block — ICE:</strong> freezes where it stands into a ' +
        'solid block <strong>one tile wide</strong>, snapped to that tile. Everything is pushed out of it ' +
        '— <strong>enemies, your own squad and you</strong>, because a block your side can stand ' +
        'inside is cover rather than a wall. It stops being a unit: it does not walk, fight or seek, and ' +
        'it holds its tile however hard it is shoved. <strong>Long-press it → THAW</strong> to melt it ' +
        'and put it back in the line.</div>' +

        '<div class="cm-build-row"><span class="cm-build-label">Worth</span>' +
        'About <span class="cm-stat">' + pct + '%</span> of what that predator used to be worth. ' +
        'The trip is the price of collecting it.</div>' +
        '<div class="cm-tip"><strong>The trade:</strong> every follower on the work crew is one that is not ' +
        'holding the line. Field none and the battlefield fills with charge you cannot spend, and your ' +
        'pylons stay in pieces.</div>';
}
