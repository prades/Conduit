// THE GAME INDEX AND THE ICONS (game.html #controlsMenu; js/icons.js) — "rewrite the information to be
// as relevant as possible, giving rough information on the different systems. Make the information more
// intuitive [...] Make more icons for all the elements." The index is the facility's: five tabs (START,
// CONTROLS, ELEMENTS, SQUAD, ENEMIES), each opening with a short overview and folding the full reference
// under "In detail", with an icon on every tab and card. (The strip game's PYLONS / POWER / WORLD tabs,
// its drawn pictures (js/indexart.js) and the pylon icons went with it.)
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HTML = rd('game.html');

let failures = 0;
function group(n) { console.log('\n' + n); }
async function check(name, fn) {
    try { await fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }

const menu = HTML.slice(HTML.indexOf('<div id="controlsMenu">'), HTML.indexOf('<!-- OVERLAY'));

(async () => {
    const ctx = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('typeof facilityPlay !== "undefined" && facilityPlay === true'), 'fixture: the page did not boot the facility');

    group('ICONS');

    await check('THE ASK: an icon for every element', () => {
        const missing = run('ELEMENTS.filter(e => !ICONS[ELEMENT_ICON[e.id]]).map(e => e.id)');
        ok(missing.length === 0, 'no icon for ' + missing.join(', '));
    });
    await check('and for the systems the index explains (the pylon and formation icons went with the strip game)', () => {
        for (const id of ['crystal', 'shard', 'power', 'follower', 'clone', 'predator', 'night', 'wheel', 'shield', 'controls'])
            ok(run(`!!ICONS[${JSON.stringify(id)}]`), 'no ' + id + ' icon');
        ok(run('typeof PYLON_KIND_ICON === "undefined" && typeof FORMATION_ICON === "undefined"'), 'the pylon / formation icon tables are back');
        for (const id of ['pylon', 'ultra', 'mk2', 'battery', 'generator', 'connector', 'nest', 'zone', 'worker', 'thief', 'machine']) ok(!run(`!!ICONS[${JSON.stringify(id)}]`), 'a ' + id + ' icon is still in the set');
    });
    await check('an icon is an SVG in the colour it is given; an unknown one is nothing', () => {
        const s = run('iconSVG("fire", "#123456", 20)');
        ok(/^<svg[^>]*viewBox="0 0 24 24"/.test(s) && /#123456/.test(s) && /width="20"/.test(s), s.slice(0, 120));
        ok(run('iconSVG("no-such-icon", "#fff")') === '', 'an unknown id drew something');
    });
    await check('every icon is well-formed: balanced tags, nothing but drawing', () => {
        const ids = run('ICON_IDS');
        for (const id of ids) {
            const s = run(`iconSVG(${JSON.stringify(id)}, "#0f8", 16)`);
            ok(!/<script|on\w+=/i.test(s), id + ' carries script');
            const opens = (s.match(/<(path|g|rect|circle|ellipse|svg)\b[^>]*[^/]>/g) || []).length;
            const closes = (s.match(/<\/(path|g|rect|circle|ellipse|svg)>/g) || []).length;
            ok(opens === closes, id + ': ' + opens + ' open tags, ' + closes + ' closed');
        }
    });
    await check('on the canvas an icon is rasterised once and stamped; until then the caller keeps its fallback', () => {
        // No Image in the test page: iconCanvas answers null and drawIcon false,
        // so every caller keeps its fallback.
        ok(run('iconCanvas("fire", "#ff3300", 16)') === null && run('drawIcon(ctx, "fire", "#ff3300", 0, 0, 16)') === false, 'no fallback');
    });
    await check('the page fills its icon slots from the same set (fillIconSlots), so the index and the canvas cannot disagree', () => {
        ok(/function fillIconSlots\(root\)/.test(rd('js/icons.js')) && /fillIconSlots\(\);/.test(rd('js/icons.js')), 'the slots are not filled at load');
        ok(/class="ix-i" data-icon="/.test(menu), 'the index has no icon slots');
    });

    group('THE INDEX');

    const tabs = [...menu.matchAll(/<button class="cm-tab[^"]*" data-tab="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)].map(m => ({ id: m[1], label: m[2].replace(/<[^>]+>/g, '').trim() }));
    const section = id => { const i = menu.indexOf('id="' + id + '" class="cm-section'); ok(i > -1, 'no section ' + id); const j = menu.indexOf('class="cm-section', i + 40); return menu.slice(i, j > -1 ? j : menu.indexOf('<!-- .cm-body -->')); };
    await check('THE ASK: one tab per system, each with its icon: START, CONTROLS, ELEMENTS, SQUAD, ENEMIES (no PYLONS, POWER or WORLD: the facility has none)', () => {
        ok(JSON.stringify(tabs.map(t => t.label)) === JSON.stringify(['START', 'CONTROLS', 'ELEMENTS', 'SQUAD', 'ENEMIES']), JSON.stringify(tabs));
        for (const t of tabs) ok(new RegExp('id="' + t.id + '" class="cm-section').test(menu), 'no section for ' + t.id);
        const btns = [...menu.matchAll(/<button class="cm-tab[\s\S]*?<\/button>/g)].map(m => m[0]);
        ok(btns.every(b => /class="ix-i" data-icon=/.test(b)), 'a tab has no icon');
    });
    await check('it opens on a START page that says how a game goes: six steps, from the blackout to the Crystal', () => {
        ok(/id="cmStart" class="cm-section active"/.test(menu), 'it does not open on START');
        const st = section('cmStart');
        ok((st.match(/class="ix-step"/g) || []).length === 6, 'not six steps');
        for (const w of ['Find supplies in the dark', 'Restore a relay', 'Gather a squad', 'Hunt the arena', 'Level, evolve, clone', 'Defend the Crystal']) ok(st.includes(w), 'no step: ' + w);
        for (const w of ['Build pylons', 'Power them', 'Take the next zone', 'Survive the night']) ok(!st.includes(w), 'a step of the strip game is still listed: ' + w);
    });
    await check('every tab leads with a short overview; the full reference is folded underneath', () => {
        for (const t of tabs) ok(/class="ix-lede"/.test(section(t.id)), t.label + ' has no overview');
        for (const t of tabs) ok(/<details class="cm-more">/.test(section(t.id)), t.label + ' folds nothing');
        ok((menu.match(/<details class="cm-more">/g) || []).length >= 10, 'the reference is not folded');
    });
    await check('every icon slot names an icon that exists', () => {
        const ids = [...new Set([...menu.matchAll(/data-icon="([^"]+)"/g)].map(m => m[1]))];
        const bad = ids.filter(id => !run(`!!ICONS[${JSON.stringify(id)}]`));
        ok(bad.length === 0, 'no such icon: ' + bad.join(', '));
    });
    await check('stale entries are gone: nothing of the strip game is described (pylons, zones, waves, nests, build mode, the work crew)', () => {
        ok(!/Ghostphage/.test(menu), 'the Ghostphage build is still listed');
        ok(!/Elite Vanguard|Apex Unit|Strike Force/.test(menu), 'the zone-control armaments are still listed');
        const text = menu.replace(/<[^>]+>/g, ' ');
        for (const w of [/\bpylons?\b/i, /\bzones?\b/i, /\bwaves?\b/i, /\bnests?\b/i, /build mode/i, /work crew/i, /\bsieges?\b/i, /shield cells?/i, /\bMK II\b/]) ok(!w.test(text), 'the index still mentions ' + w);
    });
    await check('the element cards give each element\'s matchups (as the game plays them) and its squad\'s attacks', () => {
        const el = section('cmElements');
        ok((el.match(/class="ix-el"/g) || []).length === 6, 'not six element cards');
        for (const w of ['Beats', 'weak to', 'Squad', 'THE WHEEL']) ok(el.includes(w), 'no "' + w + '"');
        // The wheel as the game has it: fire > flux > toxic > fire, electric > core > ice > electric.
        for (const e of ['fire', 'electric', 'ice', 'flux', 'core', 'toxic']) {
            const i = el.indexOf('<div class="ix-card-h"><i class="ix-i" data-icon="' + e + '"'), card = el.slice(i, el.indexOf('</div></div>', i));
            ok(i > -1, 'no card for ' + e);
            const beats = (card.match(/Beats<\/b> <i[^>]*data-icon="(\w+)"/) || [])[1], weak = (card.match(/weak to<\/b> <i[^>]*data-icon="(\w+)"/) || [])[1];
            ok(beats && weak, e + ' has no matchups');
            ok(run(`getElementMultiplier(${JSON.stringify(e)}, ${JSON.stringify(beats)})`) > 1, e + ' does not beat ' + beats + ' in the game');
            ok(run(`getElementMultiplier(${JSON.stringify(weak)}, ${JSON.stringify(e)})`) > 1, weak + ' does not beat ' + e + ' in the game');
            ok(/<b>Squad<\/b>/.test(card), e + ' has no squad line');
        }
    });
    await check('the CONTROLS tab describes the HUD the player is looking at: the crystals, the health and ultimate, the room tag, the network panel, the alarm triangle, the squad bar and the dial', () => {
        const c = section('cmControls');
        ok(/THE HUD/.test(c), 'no HUD section');
        for (const w of ['room tag', 'network panel', 'alarm triangle', 'ULTIMATE', 'squad bar', 'enemy card', 'round dial']) ok(c.includes(w), 'the HUD section does not mention the ' + w);
        for (const b of ['ROSTER', 'CLONES', 'SETTINGS', 'PACK', 'MAP', '?']) ok(new RegExp('<span class="cm-build-label">' + b.replace('?', '\\?') + '</span>').test(c), 'the dock description has no ' + b);
        // The alarm names the index promises are the ones the game can raise (js/alarm.js).
        const A = rd('js/alarm.js');
        for (const kind of ['PROXIMITY ALARM', 'FACILITY BREACH']) ok(menu.includes(kind) && A.includes(kind), kind + ': the index and js/alarm.js disagree');
    });
    await check('the clone prices are built from CLONE_COSTS at runtime, not retyped', () => {
        ok(/<div id="cmCloneCosts"><\/div>/.test(menu), 'no slot for the clone prices');
        ok(/function renderCloneCostIndex/.test(rd('js/clone.js')) && /renderCloneCostIndex\(\)/.test(rd('js/init.js')), 'the prices are not rendered at boot');
    });
    await check('reference rows flow as text (they were flex rows that broke sentences into columns)', () => {
        ok(/#controlsMenu \.ctrl-row, #controlsMenu \.cm-build-row \{ display: flow-root;/.test(HTML), 'rows are still flex');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
