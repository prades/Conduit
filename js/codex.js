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
    { t: 'WAVE MODE: SUPPORT (electric, core) aids your side, DISRUPTION (fire, ice, flux, toxic) hits foes. Links same-element pylons in 3 tiles; wakes only when a unit it works on is near.' },
    { t: 'Chains are fine. Links that would just close a loop are skipped, so the network stays a tree.' },
    null,
    { h: 'NETWORK TIERS' },
    { t: 'The largest linked group of one element, turrets and wave pylons alike, sets its tier. Bigger network, stronger effect.' },
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
    { t: 'A generator (or connector) links ITSELF to the closest nest you hold in range — no button to press. No elemental pylon can take that link.' },
    { t: 'Because of that, it can only be built near a nest, and it links the moment it stands.' },
    ['MAX RANGE', GENERATOR_NEST_RANGE + ' tiles from a nest', '#8fa'],
];

// Infestation gets its own page too. The important line is the last one: the
// player needs to know RECLAIM exists, or a converted pylon looks permanent.
const CODEX_INFEST = [
    { h: 'HUNTERS' },
    { t: 'About one predator in four is a hunter. Left alone, with no alarm up, it walks to your nearest pylon and starts chewing it over to its side.' },
    ['CONVERSION', (1 / INFEST_RATE / 60).toFixed(0) + 's of contact', '#f88'],
    { t: 'A bar shows it happening. Interrupt the predator and the pylon recovers on its own.' },
    null,
    { h: 'FEEDING THE WALL NEST' },
    { t: 'BEETLES are the haulers: an idle beetle picks up charged mass lying on the floor and carries it to its zone\'s wall nest. The nest shows how much it holds.' },
    ['HATCHES', 'one predator per ' + NEST_SPAWN_COST + ' mass paid in', '#ff7744'],
    { t: 'What hatches is the tier below the hauler — a beetle\'s haul makes ants. Haul the mass away first and there is nothing to feed the nest.' },
    null,
    { h: 'TAKING IT BACK' },
    { t: 'Long-press a red pylon and pick RECLAIM. A crew rebuilds it. If the crew dies, order it again — UPGRADE will not do, it is not yours yet.' },
];

// Each entry: what the element is for, then what each tier adds.
const CODEX_ELEMENTS = {
    fire: {
        role: 'DAMAGE',
        summary: 'Burns anything hostile standing in the network zone. The straightforward damage option.',
        tiers: {
            1: '9 damage every 0.4s.',
            2: '15 damage, and faster — every 0.3s.',
            3: '24 damage every 0.2s. Each hit has a 50% chance to ignite, spreading 6 damage to enemies within 1.5 tiles.',
        },
        numbers: { dmg: [9, 15, 24] },
    },
    ice: {
        role: 'CONTROL',
        summary: 'Slows anything hostile in the zone to a crawl. Buys your followers time rather than killing.',
        tiers: {
            1: 'Enemies move at 25% speed.',
            2: '12% speed, with a fair chance each moment to freeze one solid.',
            3: 'Deep freeze — 5% speed, plus 6 ice damage every second.',
        },
        numbers: { slow: [0.25, 0.12, 0.05] },
    },
    electric: {
        role: 'SUPPORT',
        summary: 'Charges your own side instead of hurting theirs, and SPEEDS THEM UP. Feeds resonance to allies in the zone and makes them run faster, so it is the lane to send followers back to the fight or out for shards.',
        tiers: {
            1: '+3 resonance to every ally, six times a second. Allies move 1.35\u00d7 as fast.',
            2: '+6 resonance, ultimate charge builds faster. Allies move 1.6\u00d7 as fast.',
            3: '+10 resonance, ultimates charge faster still. Allies move 1.9\u00d7 as fast \u2014 the fastest lane on the map.',
        },
        numbers: { gain: [3, 6, 10], haste: [1.35, 1.6, 1.9] },
    },
    core: {
        role: 'DEFENCE',
        summary: 'Wraps allies in the zone in a regenerating shield that soaks damage before health does.',
        tiers: {
            1: '+5 shield every 0.75s, up to 30.',
            2: '+8 shield every 0.5s, up to 50.',
            3: '+12 shield every 0.33s, up to 75, and broken shields repair themselves.',
        },
        numbers: { gain: [5, 8, 12], cap: [30, 50, 75] },
    },
    flux: {
        role: 'CONTROL',
        summary: 'Drags enemies toward the middle of the link. Use it to pull a wave off your Crystal and bunch it up for something else to hit.',
        tiers: {
            1: 'Steady pull toward the midpoint.',
            2: 'Stronger pull, and dragged enemies drag their neighbours along.',
            3: 'Vortex — strongest pull, plus 5 damage every 0.33s to anything caught.',
        },
        numbers: { pull: [0.14, 0.21, 0.28] },
    },
    toxic: {
        role: 'DAMAGE',
        summary: 'Poisons and strips armour. Lower damage than fire, but it makes everything else hit harder.',
        tiers: {
            1: '8 damage every 0.5s, 45% chance to shred defence.',
            2: '12 damage every 0.37s, 65% chance to shred, and the shred bites deeper.',
            3: '18 damage every 0.25s, 80% chance to shred, and the cloud spreads the shred to enemies within 1.5 tiles.',
        },
        numbers: { dmg: [8, 12, 18] },
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

// THE COMBO COLLECTION. Fifteen pairs of elements; a pair you have never
// linked shows only as ??? until you find it (docs/ROADMAP-top5.md §1).
function codexComboRows(maxChars) {
    const w = maxChars || 48;
    const rows = [];
    codexWrap('Link a support or disruption pylon to an awake one of ANOTHER element within 3 tiles.', w)
        .forEach(l => rows.push({ t: l, c: '#aad' }));
    rows.push(null);
    const label = id => { const e = ELEMENTS.find(x => x.id === id); return e ? e.label.toUpperCase() : id; };
    Object.keys(ELEMENT_COMBOS).forEach(key => {
        const found = typeof comboDiscovered !== 'undefined' && comboDiscovered.has(key);
        const [a, b] = key.split('+');
        rows.push(found ? [ELEMENT_COMBOS[key].name, label(a) + ' + ' + label(b), '#ffe066']
                        : ['???', '??? + ???', '#556']);
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
    rows.push(['COMBOS', (typeof comboDiscovered !== 'undefined' ? comboDiscovered.size : 0) + ' / 15 FOUND', '#ffe066', { codexPage: 'combos' }]);
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
            'The largest connected group — turrets and wave pylons alike — sets that element\'s tier.</div>';
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
    // Stated per second, which is the unit the player experiences; the
    // constant is per frame.
    const mendRate = (typeof MEND_RATE === 'number')
        ? (MEND_RATE * 60).toFixed(1).replace(/\.0$/, '') : '4';
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
        '<div class="cm-build-row"><span class="cm-build-label">By group</span>' +
        '<strong>Long-press a row in the follower index</strong>, bottom left, to order that ' +
        'whole group at once \u2014 one press instead of one per follower. On the <strong>ELEM</strong> ' +
        'tab a row is an element; on <strong>UNITS</strong> it is a role, so BRAWLERS, SNIPERS and ' +
        'CAMPERS each move together across every element they are made of. The menu says how many ' +
        'are already working before you choose. <strong>RE-ROLL ALL</strong> sends the whole group ' +
        'back to the Crystal to be made again \u2014 tap it twice, so it cannot happen by accident.</div>' +
        '<div class="cm-build-row"><span class="cm-build-label">Call back</span>' +
        'The same long press takes one OFF the crew. A frozen ICE block says <strong>THAW</strong> ' +
        'instead of TO LINE \u2014 press the BLOCK itself, not the air above it. And a worker with an ' +
        'enemy right on top of it, which is where a TOXIC repeller always is, can still be reached: ' +
        'whichever of the two is nearer your finger wins the ring.</div>' +
        '<div class="cm-build-row"><span class="cm-build-label">Re-roll</span>' +
        'Long-press a follower \u2192 radial LEFT \u2192 <strong>RE-ROLL</strong>. It drops what it ' +
        'carries, walks back to the Crystal and comes out as a new recruit: element drawn from the ' +
        'modulation pool again, with freshly rolled stats, role and traits. Clones cannot be re-rolled.</div>' +
        '<div class="cm-build-row"><span class="cm-build-label">Fighters</span>' +
        'Behave exactly as before. Every follower starts as one.</div>' +
        '<div class="cm-build-row"><span class="cm-build-label">Workers</span>' +
        'Ignore combat and do one job each. Only ' + whoText + ' can — ' +
        'nothing else has a job to do.</div>' +

        '<div class="cm-ability"><strong>1. Neutralise \u2014 ELECTRIC:</strong> stands on a charged lump and ' +
        'bleeds the charge off over about <span class="cm-stat">' + secs + 's</span>. Until then it just crackles.</div>' +
        '<div class="cm-ability"><strong>2. Haul \u2014 FLUX:</strong> drags an inert lump to the nearest drop-off \u2014 ' +
        'the Crystal, or the wall nest of any zone you hold \u2014 where it pays out as shards. Kill the carrier and the lump drops where it fell.</div>' +
        '<div class="cm-ability"><strong>Repair \u2014 CORE:</strong> a pylon that loses its health is not gone, ' +
        'it is <strong>broken</strong> — it keeps its tile, its element and its mode. A core worker rebuilds it ' +
        'in place, exactly as it was. Nothing else can.</div>' +
        '<div class="cm-ability"><strong>Tend a clone — TOXIC:</strong> a medic for the most ' +
        'expensive unit you own. It picks a clone, <strong>walks with it</strong>, and mends it at ' +
        '<span class="cm-stat">' + mendRate + ' HP a second</span> while it fights. It does ' +
        '<strong>no damage at all</strong> — what it buys you is a clone that keeps standing, and ' +
        'a clone carries <span class="cm-stat">3&times;</span> the health of what it was cloned ' +
        'from, so there is a lot of bar to top up. A HURT clone is chosen first; with none hurt it ' +
        'escorts the nearest one anyway, because a medic that only turns up once you are bleeding ' +
        'is always too late.</div>' +
        '<div class="cm-ability"><strong>Set a block — ICE:</strong> freezes where it stands into a ' +
        'solid block <strong>one tile wide</strong>, snapped to that tile. Everything is pushed out of it ' +
        '— <strong>enemies, your own squad and you</strong>, because a block your side can stand ' +
        'inside is cover rather than a wall. It stops being a unit: it does not walk, fight or seek, and ' +
        'it holds its tile however hard it is shoved. <strong>Long-press it → THAW</strong> to melt it ' +
        'and put it back in the line.</div>' +

        '<div class="cm-build-row"><span class="cm-build-label">It keeps</span>' +
        'Mass you have not hauled home <strong>stays on the floor between rounds</strong>. ' +
        'A lump someone was carrying when the round turned over is simply dropped where ' +
        'they stood, and the next FLUX worker picks it up.</div>' +
        '<div class="cm-build-row"><span class="cm-build-label">Worth</span>' +
        '<span class="cm-stat">' + pct + '%</span> of what that predator was worth' +
        (pct >= 100
            ? ' — the full amount. This lump is the ONLY shard a kill gives, so the ' +
              'two jobs are the price, not a cut taken off the top.'
            : ' — the trip is the price of collecting it.') +
        '</div>' +
        '<div class="cm-tip"><strong>The trade:</strong> every follower on the work crew is one that is not ' +
        'holding the line. Field none and the battlefield fills with charge you cannot spend, and your ' +
        'pylons stay in pieces.</div>';
}

// ── GAME INDEX — CLONE SUMMONING ─────────────────────────
// Generated from CLONE_COSTS and cloneShardCost() in js/species.js. The table
// that used to sit in game.html was hand-written, and it was still promising
// "1 follower / +1 follower" after followers had stopped being the price at
// all — the exact drift this replaces.
function renderCloneCostIndex() {
    if (typeof document === 'undefined') return;
    const host = document.getElementById('cmCloneCosts');
    if (!host) return;
    if (typeof CLONE_COSTS === 'undefined' || typeof cloneShardCost !== 'function') return;

    const lo = typeof CLONE_SHARD_MIN === 'number' ? CLONE_SHARD_MIN : 5;
    const hi = typeof CLONE_SHARD_MAX === 'number' ? CLONE_SHARD_MAX : 25;
    const cap = typeof MAX_CLONES === 'number' ? MAX_CLONES : 4;
    // Only the species you can actually meet and clone. The synthetic
    // constructs have entries so an unknown DNA key cannot crash or come free,
    // but they are not offered, so listing them would be a lie.
    const natural = ['ant', 'beetle', 'mantis', 'scorpion', 'spider', 'moth']
        .filter(s => CLONE_COSTS[s]);
    // The classes the menu actually offers — see getCloneOptions.
    const classes = ['scout', 'striker', 'tank'];

    let rows = '<tr><th>Species</th><th>DNA needed</th>'
             + classes.map(c => '<th>' + c[0].toUpperCase() + c.slice(1) + '</th>').join('')
             + '</tr>';
    for (const s of natural) {
        const col = (typeof SPECIES !== 'undefined' && SPECIES[s] && SPECIES[s].color) || '#aaa';
        rows += '<tr><td style="color:' + col + '">' + s[0].toUpperCase() + s.slice(1) + '</td>'
              + '<td>' + CLONE_COSTS[s].splicesNeeded + ' splices</td>'
              + classes.map(c => '<td>' + cloneShardCost(s, c) + '✦</td>').join('')
              + '</tr>';
    }

    host.innerHTML =
        '<div class="ctrl-row cm-dim" style="margin-bottom:5px">Spend <strong>DNA splices</strong> ' +
        '(dropped by enemies) and <strong>shards</strong> to summon an enemy species as your ally. ' +
        'Max <span class="cm-stat">' + cap + ' active clones</span> at once.</div>' +
        '<div class="ctrl-row cm-dim" style="margin-bottom:5px"><strong>It costs you no followers.</strong> ' +
        'It used to kill up to five of them at the Crystal, which is why nobody used it — trading your ' +
        'squad for one unit of a squad is not a trade you take twice. The splices stay, because they are ' +
        'what makes a clone specific to something you actually fought and killed.</div>' +
        '<table class="cm-clone-table">' + rows + '</table>' +
        '<div class="ctrl-row cm-dim">Prices start at <span class="cm-stat">' + lo + '✦</span> for the ' +
        'lowest grade and the scale tops out at <span class="cm-stat">' + hi + '✦</span>. The table ' +
        'stops at MOTH because the deep-zone <strong>synthetic constructs</strong> are not offered for ' +
        'cloning — they hold the top of that scale.</div>';
}
