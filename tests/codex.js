// The pylon codex explains what each element does. Documentation that drifts
// from the code is worse than none, so most of this suite reads the real
// numbers back out of game.js and fails if the text disagrees.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const GAME  = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
const CAMP  = fs.readFileSync(path.join(ROOT, 'js/camp.js'), 'utf8');

const sandbox = {
    console, Math, Array, Object, String, Number, isNaN, isFinite, parseInt,
    ELEMENTS: [
        { id: 'fire',     label: 'FIRE',     color: '#ff3300' },
        { id: 'electric', label: 'ELECTRIC', color: '#ffee33' },
        { id: 'ice',      label: 'ICE',      color: '#99ddff' },
        { id: 'flux',     label: 'FLUX',     color: '#9933ff' },
        { id: 'core',     label: 'CORE',     color: '#00ccaa' },
        { id: 'toxic',    label: 'TOXIC',    color: '#66ff66' },
    ],
};
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/codex.js'), 'utf8'), ctx, { filename: 'js/codex.js' });
const run = s => vm.runInContext(s, ctx);

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function eq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// Pull the three tier values out of a ternary chain like
//   _nTier >= 3 ? 15 : _nTier >= 2 ? 10 : 6
function tierTriple(src, anchor, varName) {
    const at = src.indexOf(anchor);
    if (at < 0) throw new Error('anchor not found in game.js: ' + anchor);
    const slice = src.slice(at, at + 900);
    // Anchored on the assignment, because several blocks declare an interval
    // ternary before the damage one and a bare match grabs the wrong numbers.
    const re = new RegExp(varName + '\\s*=\\s*Math\\.round\\(\\(_nTier >= 3 \\? ([\\d.]+) : _nTier >= 2 \\? ([\\d.]+) : ([\\d.]+)\\)');
    const m = slice.match(re);
    if (!m) throw new Error('no ' + varName + ' ternary after ' + anchor);
    return [Number(m[3]), Number(m[2]), Number(m[1])];   // tier I, II, III
}

const ELEMENTS = sandbox.ELEMENTS;
const CODEX = run('CODEX_ELEMENTS');

group('coverage');
check('every playable element has a codex entry', () => {
    for (const el of ELEMENTS) ok(CODEX[el.id], 'missing entry for ' + el.id);
});
check('every entry has a role, a summary and all three tiers', () => {
    for (const [id, e] of Object.entries(CODEX)) {
        ok(typeof e.role === 'string' && e.role.length, id + ' role');
        ok(typeof e.summary === 'string' && e.summary.length > 20, id + ' summary');
        for (const t of [1, 2, 3]) ok(typeof e.tiers[t] === 'string' && e.tiers[t].length > 5, id + ' tier ' + t);
    }
});
check('no element is documented twice under a different name', () => {
    const ids = Object.keys(CODEX);
    eq(new Set(ids).size, ids.length, 'duplicate ids');
    for (const id of ids) ok(ELEMENTS.some(e => e.id === id), id + ' is not a real element');
});
check('higher tiers say more than lower ones', () => {
    for (const [id, e] of Object.entries(CODEX)) {
        ok(e.tiers[3].length >= e.tiers[1].length, id + ': tier III should describe at least as much as tier I');
    }
});

group('the documented numbers match game.js');
check('network tier thresholds match the live rule', () => {
    const m = GAME.match(/maxGroupSize >= (\d+) \? 3 : maxGroupSize >= (\d+) \? 2 : maxGroupSize >= (\d+) \? 1/);
    ok(m, 'tier rule not found in game.js');
    const sizes = run('CODEX_TIER_SIZES');
    eq(sizes[3], Number(m[1]), 'tier III size');
    eq(sizes[2], Number(m[2]), 'tier II size');
    eq(sizes[1], Number(m[3]), 'tier I size');
});
check('FIRE damage per tier matches', () => {
    const live = tierTriple(GAME, 'case "fire": {', 'dmg');
    ok(CODEX.fire.numbers.dmg.every((v, i) => v === live[i]),
       `codex says ${CODEX.fire.numbers.dmg} but game.js does ${live}`);
    live.forEach(v => ok(CODEX.fire.tiers[live.indexOf(v) + 1].includes(String(v)),
                         'tier text should name its damage value ' + v));
});
check('TOXIC damage per tier matches', () => {
    const live = tierTriple(GAME, 'case "toxic": {', 'tdmg');
    ok(CODEX.toxic.numbers.dmg.every((v, i) => v === live[i]),
       `codex says ${CODEX.toxic.numbers.dmg} but game.js does ${live}`);
});
check('ELECTRIC resonance gain per tier matches', () => {
    const live = tierTriple(GAME, 'case "electric": {', 'gain');
    ok(CODEX.electric.numbers.gain.every((v, i) => v === live[i]),
       `codex says ${CODEX.electric.numbers.gain} but game.js does ${live}`);
});
check('CORE shield gain and cap per tier match', () => {
    const at = GAME.indexOf('case "core": {');
    const slice = GAME.slice(at, at + 700);
    const gain = slice.match(/shGain = Math\.round\(\(_nTier >= 3 \? (\d+) : _nTier >= 2 \? (\d+) : (\d+)\)/);
    const cap  = slice.match(/shCap\s*= _nTier >= 3 \? (\d+) : _nTier >= 2 \? (\d+) : (\d+)/);
    ok(gain && cap, 'core numbers not found');
    const liveGain = [Number(gain[3]), Number(gain[2]), Number(gain[1])];
    const liveCap  = [Number(cap[3]),  Number(cap[2]),  Number(cap[1])];
    ok(CODEX.core.numbers.gain.every((v, i) => v === liveGain[i]), `gain ${CODEX.core.numbers.gain} vs ${liveGain}`);
    ok(CODEX.core.numbers.cap.every((v, i) => v === liveCap[i]),   `cap ${CODEX.core.numbers.cap} vs ${liveCap}`);
    for (const t of [1, 2, 3]) ok(CODEX.core.tiers[t].includes(String(liveCap[t - 1])), 'tier ' + t + ' should name its cap');
});
check('FLUX pull strength per tier matches', () => {
    const at = GAME.indexOf('case "flux": {');
    const m = GAME.slice(at, at + 400).match(/pullSpd = \(_nTier >= 3 \? ([\d.]+) : _nTier >= 2 \? ([\d.]+) : ([\d.]+)\)/);
    ok(m, 'flux pull not found');
    const live = [Number(m[3]), Number(m[2]), Number(m[1])];
    ok(CODEX.flux.numbers.pull.every((v, i) => Math.abs(v - live[i]) < 1e-9),
       `codex says ${CODEX.flux.numbers.pull} but game.js does ${live}`);
    ok(live[0] < live[1] && live[1] < live[2], 'pull should strengthen with tier');
});
check('ICE slow factors per tier match', () => {
    const at = GAME.indexOf('case "ice": {');
    const slice = GAME.slice(at, at + 1100);
    const factors = [...slice.matchAll(/applySlow\(a, \d+, ([\d.]+)\)/g)].map(m => Number(m[1]));
    // deep freeze, tier-2 base, the rare solid freeze, tier-1 base
    ok(factors.length >= 3, 'ice slows not found, got ' + factors);
    const live = CODEX.ice.numbers.slow;
    for (const f of live) ok(factors.includes(f), `codex claims a ${f} slow that game.js never applies`);
    ok(live[0] > live[1] && live[1] > live[2], 'slows should deepen with tier');
});
check('the seasoned multiplier matches', () => {
    const m = GAME.match(/seasoned > 0\) \? ([\d.]+) : 1\.0/);
    ok(m, 'seasoned bonus not found');
    const general = run('CODEX_GENERAL').filter(r => r && r.t).map(r => r.t).join(' ');
    ok(general.includes(m[1]), `codex should name the ${m[1]} seasoned multiplier`);
});
check('the stated link range matches getPylonRange', () => {
    const m = CAMP.match(/const PYLON_LINK_TILES\s*=\s*(\d+)/);
    ok(m, 'PYLON_LINK_TILES not found');
    const general = run('CODEX_GENERAL').filter(r => r && r.t).map(r => r.t).join(' ');
    ok(general.includes(m[1] + ' tiles'), `codex should say "${m[1]} tiles" for the link range`);
});
check('the CORE multi-pylon zone note matches the live threshold', () => {
    const m = GAME.match(/corePylons\.length >= (\d+)/);
    ok(m, 'core zone threshold not found');
    const note = run('CODEX_NOTES').core;
    ok(note && /three|3/i.test(note), 'core note should state the pylon count');
    eq(Number(m[1]), 3, 'live threshold is no longer three');
});

group('text wrapping');
const wrap = run('codexWrap');
check('no wrapped line exceeds the budget', () => {
    for (const [, e] of Object.entries(CODEX)) {
        for (const line of wrap(e.summary, 40)) ok(line.length <= 40, 'too long: ' + line);
        for (const t of [1, 2, 3]) for (const line of wrap(e.tiers[t], 40)) ok(line.length <= 40, 'too long: ' + line);
    }
});
check('words are never split mid-word', () => {
    const src = 'alpha bravo charlie delta echo foxtrot';
    const joined = wrap(src, 12).join(' ');
    eq(joined, src, 'round trip');
});
check('a word longer than the budget still gets its own line', () => {
    const lines = wrap('tiny supercalifragilistic x', 8);
    ok(lines.some(l => l === 'supercalifragilistic'), 'long word should stand alone, got ' + JSON.stringify(lines));
});
check('empty and whitespace input are safe', () => {
    eq(wrap('', 40).length, 1, 'empty');
    eq(wrap('   ', 40).length, 1, 'whitespace');
});

group('panel rows');
check('the index offers one tappable row per element', () => {
    const rows = run('codexIndexRows')();
    const nav = rows.filter(r => Array.isArray(r) && r[3] && r[3].codexElement);
    eq(nav.length, ELEMENTS.length, 'one row per element');
    for (const el of ELEMENTS) ok(nav.some(r => r[3].codexElement === el.id), 'missing ' + el.id);
});
check('index rows carry their element colour', () => {
    const rows = run('codexIndexRows')();
    for (const r of rows) {
        if (Array.isArray(r) && r[3] && r[3].codexElement) {
            const el = ELEMENTS.find(e => e.id === r[3].codexElement);
            eq(r[2], el.color, el.id + ' colour');
        }
    }
});
check('every element detail page builds without holes', () => {
    for (const el of ELEMENTS) {
        const rows = run('codexElementRows')(el.id, 40);
        ok(rows.length > 6, el.id + ' page is too thin');
        rows.forEach((r, i) => {
            if (r === null) return;
            ok(Array.isArray(r) || typeof r.t === 'string' || typeof r.h === 'string',
               el.id + ' row ' + i + ' is malformed: ' + JSON.stringify(r));
        });
        const text = rows.filter(r => r && r.h).map(r => r.h).join(' ');
        for (const t of ['I', 'II', 'III']) ok(text.includes('TIER ' + t), el.id + ' missing tier ' + t);
    }
});
check('no page is tall enough to run off a small screen', () => {
    // Panel height is 94 + rows*20. A 600px-tall viewport fits about 25 rows,
    // and the index previously ran to 40 once its prose was wrapped.
    const MAX_ROWS = 25;
    const pages = { index: run('codexIndexRows')(48), rules: run('codexRulesRows')(48) };
    ELEMENTS.forEach(el => { pages[el.id] = run('codexElementRows')(el.id, 48); });
    for (const [name, rows] of Object.entries(pages)) {
        ok(rows.length <= MAX_ROWS,
           `${name} page is ${rows.length} rows (${94 + rows.length * 20}px tall), max ${MAX_ROWS}`);
    }
});
check('the index links to the general rules page', () => {
    const rows = run('codexIndexRows')(48);
    ok(rows.some(r => Array.isArray(r) && r[3] && r[3].codexPage === 'rules'), 'no rules link');
});
check('the rules page states the modes and the tier table', () => {
    const rows = run('codexRulesRows')(48);
    const text = rows.filter(r => r && (r.t || r.h)).map(r => r.t || r.h).join(' ');
    for (const word of ['ATTACK MODE', 'WAVE MODE', 'UPGRADE']) ok(text.includes(word), 'missing ' + word);
    ok(rows.some(r => Array.isArray(r) && /TIER I\b/.test(r[0])), 'tier table missing');
});
group('inline pylon explanation');
check('THE REPORTED CASE: a pylon page explains its element, not just names it', () => {
    for (const el of ELEMENTS) {
        const rows = run('codexPylonRows')(el.id, 48, 0);
        ok(rows.length > 6, el.id + ' produced almost nothing');
        const text = rows.filter(r => r && (r.t || r.h)).map(r => r.t || r.h).join(' ');
        ok(text.includes(el.label.toUpperCase()), el.id + ' should name the element');
        ok(text.includes(CODEX[el.id].role), el.id + ' should state its role');
        // the summary has to actually be in there, not just a heading
        const firstWords = CODEX[el.id].summary.split(' ').slice(0, 3).join(' ');
        ok(text.includes(firstWords), el.id + ' is missing its summary');
    }
});
check('all three tiers and their thresholds are listed', () => {
    const rows = run('codexPylonRows')('fire', 48, 0);
    const heads = rows.filter(r => r && r.h).map(r => r.h).join(' | ');
    for (const [tier, size] of [['I', 2], ['II', 4], ['III', 6]]) {
        ok(heads.includes('TIER ' + tier + ' (' + size + '+)'), 'missing TIER ' + tier);
    }
});
check('the live tier is marked, and only that one', () => {
    const rows = run('codexPylonRows')('fire', 48, 2);
    const marked = rows.filter(r => r && r.h && /ACTIVE/.test(r.h));
    eq(marked.length, 1, 'exactly one tier should be marked');
    ok(/TIER II/.test(marked[0].h), 'the wrong tier is marked: ' + marked[0].h);
});
check('with no network, no tier is marked', () => {
    const rows = run('codexPylonRows')('fire', 48, 0);
    eq(rows.filter(r => r && r.h && /ACTIVE/.test(r.h)).length, 0, 'nothing should be active');
});
check('an unknown element yields no rows rather than throwing', () => {
    eq(run('codexPylonRows')('not-an-element', 48, 0).length, 0, 'should be empty');
});
check('a dormant pylon is told what to do with it', () => {
    const rows = run('codexDormantPylonRows')(48);
    const text = rows.filter(r => r && (r.t || r.h)).map(r => r.t || r.h).join(' ');
    for (const word of ['NOT INFUSED', 'UPGRADE', 'ATTACK', 'WAVE']) {
        ok(text.includes(word), 'dormant text missing ' + word);
    }
});
check('the info panel still fits a small screen with the explanation added', () => {
    // Panel height is 94 + rows*20; the pylon readout is six rows before this.
    const MAX_ROWS = 25;
    for (const el of ELEMENTS) {
        const total = 6 + run('codexPylonRows')(el.id, 48, 2).length;
        ok(total <= MAX_ROWS, `${el.id}: ${total} rows (${94 + total * 20}px), max ${MAX_ROWS}`);
    }
    const dormant = 6 + run('codexDormantPylonRows')(48).length;
    ok(dormant <= MAX_ROWS, 'dormant: ' + dormant + ' rows');
});
check('the info panel actually calls into the codex', () => {
    const ui = fs.readFileSync(path.join(ROOT, 'js/ui.js'), 'utf8');
    ok(/codexPylonRows\(el\.id/.test(ui), 'the pylon readout does not pull in the explanation');
    ok(/codexDormantPylonRows\(/.test(ui), 'a dormant pylon gets no explanation');
});

check('an unknown element degrades instead of throwing', () => {
    const rows = run('codexElementRows')('not-an-element', 40);
    ok(rows.length >= 1 && rows[0].t, 'should return a placeholder row');
});

group('GAME INDEX pylon page');
// renderPylonIndex needs a document, which the main sandbox above does not have.
function renderIndex(mutate) {
    const slots = {};
    const sb = {
        console, Math, Array, Object, String, Number, Set, Map, isNaN, isFinite, parseInt,
        ELEMENTS, PYLON_LINK_TILES: 3, PYLON_LINK_TILES_RELAY: 5,
        document: { getElementById: id => ({
            set innerHTML(v) { slots[id] = v; },
            get innerHTML() { return slots[id]; },
        }) },
    };
    sb.globalThis = sb;
    const c2 = vm.createContext(sb);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/codex.js'), 'utf8'), c2, { filename: 'js/codex.js' });
    if (mutate) vm.runInContext(mutate, c2);
    vm.runInContext('renderPylonIndex()', c2);
    return slots;
}

check('THE REPORTED CASE: every element appears on the index pylon page', () => {
    const el = renderIndex().cmPylonElements || '';
    ok(el.length > 500, 'the element block is empty or tiny');
    for (const e of ELEMENTS) {
        ok(el.includes('>' + e.label.toUpperCase() + '<'), 'missing ' + e.label);
        ok(el.includes(CODEX[e.id].role), e.label + ' is missing its role');
    }
});
check('all three tiers are listed for all six elements', () => {
    const el = renderIndex().cmPylonElements || '';
    eq((el.match(/cm-tier-badge/g) || []).length, ELEMENTS.length * 3, 'tier rows');
    for (const e of ELEMENTS) {
        for (const t of [1, 2, 3]) {
            const words = CODEX[e.id].tiers[t].split(' ').slice(0, 3).join(' ');
            ok(el.includes(words), e.label + ' tier ' + t + ' text missing');
        }
    }
});
check('element colours carry through to the index', () => {
    const el = renderIndex().cmPylonElements || '';
    for (const e of ELEMENTS) ok(el.includes(e.color), 'missing colour for ' + e.label);
});
check('the CORE multi-pylon note is carried over', () => {
    const el = renderIndex().cmPylonElements || '';
    ok(/enclose a zone/.test(el), 'core note missing');
});
check('the stated link range is generated, not hardcoded', () => {
    const net = renderIndex().cmPylonNetwork || '';
    ok(/3 tiles/.test(net), 'should state the real 3-tile range');
    ok(/5<\/span> with the Signal Relay/.test(net) || /5<\/span>/.test(net), 'should mention the relay range');
});
check('the old stale claims are gone from game.html', () => {
    const html = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
    const pylonPage = html.slice(html.indexOf('id="cmPylons"'), html.indexOf('id="cmZones"'));
    ok(!/within <span class="cm-stat">5 tiles<\/span> auto-connect/.test(pylonPage),
       'the hardcoded 5-tile range is still there');
    ok(!/ultimate charge <span style="color:#0f8">\+15%<\/span>/.test(pylonPage),
       'the false +15% ultimate claim is still there');
    ok(/id="cmPylonElements"/.test(pylonPage), 'no slot for the element effects');
    ok(/id="cmPylonNetwork"/.test(pylonPage), 'no slot for the network block');
});
check('text from the tables is escaped, not injected', () => {
    const slots = renderIndex('CODEX_ELEMENTS.fire.summary = "<img src=x onerror=1> & co";');
    const el = slots.cmPylonElements || '';
    ok(!el.includes('<img'), 'raw markup reached the page');
    ok(el.includes('&lt;img'), 'should have been escaped');
    ok(el.includes('&amp; co'), 'ampersand should be escaped');
});
check('a missing slot is not an error', () => {
    const sb = {
        console, Math, Array, Object, String, Number, Set, Map, isNaN, isFinite, parseInt,
        ELEMENTS, document: { getElementById: () => null },
    };
    sb.globalThis = sb;
    const c2 = vm.createContext(sb);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/codex.js'), 'utf8'), c2, { filename: 'js/codex.js' });
    vm.runInContext('renderPylonIndex()', c2);   // must not throw
});
check('the index is populated at startup', () => {
    const init = fs.readFileSync(path.join(ROOT, 'js/init.js'), 'utf8');
    ok(/renderPylonIndex\(\)/.test(init), 'nothing ever fills the index page');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
