// THE CLASS CARD FAMILIES, AND SERIES 2 RESHAPED (Build B, 2026-11-02c; docs/UNIVERSAL-AND-PLAYER-CARDS.md section 2, docs/NEXT-UPDATE.md build B, docs/SERIES-2.md).
// ASKED (the owner, 2026-11-02): "How about mages get aura cards, and the brawlers get opportunity bonuses. Whenever they exploit a weakness, they get ... not double, but more power. And then technicians get cool down management."
//   MAGE AURAS    18 (six elements × Refined +5%, Precision +7.5%, Prototype +10% ATK, the Prototype with its element's status at a first-guess 5%): every follower within 4 tiles of a Mage of that element, the Mage and the
//                 Mutator's clone included; different auras stack, the same one counts once; enemies never; a faint ring and glints (js/cards.js; the clone's hits: js/helpers.js)
//   OPPORTUNITY   3 (Refined +20%, Precision +30%, Prototype +40%), for each opening a Brawler's hit meets, added up: an element match-up, a race weak to its physical type, a race weak to Elemental, a stunned or sleeping
//                 target (js/damage.js dmgApply)
//   SERIES 2      deals 45 (the 20 species cards, the Technician's 4, the 21 new ones); its eight Brawler and Mage class cards are cut, gone from saves, and each owned for good refunds ◆1,000, paid once
//   THE PLAYER    the Universal kind is retired: the player's slots take Player cards only (the Gunslinger's six since build 2026-11-02h, the Technomancer's since i, the Mutator's since j, and two test cards: tests/playercards.js)
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
const close = (a, b, e) => Math.abs(a - b) <= (e === undefined ? 1e-6 : e);

const CUT = ['knuckle_wraps', 'iron_guard', 'haymaker_gauntlet', 'cleaver_arm', 'focus_lens', 'channeling_rod', 'spellweave_circlet', 'chain_conduit'];
const AURAS = [   // the approved names (UNIVERSAL-AND-PLAYER-CARDS.md, "The 21 new cards' names"): element, Refined, Precision, Prototype
    ['fire', 'KINDLING BAND', 'HEARTH SIGIL', 'INFERNO CROWN'], ['toxic', 'SPORE BAND', 'MIASMA SIGIL', 'PESTILENCE CROWN'], ['electric', 'IONIC BAND', 'VOLTAIC SIGIL', 'TEMPEST CROWN'],
    ['ice', 'CHILL BAND', 'GLACIAL SIGIL', 'WINTER CROWN'], ['flux', 'PHASE BAND', 'WARP SIGIL', 'ECLIPSE CROWN'], ['core', 'LODESTONE BAND', 'KEYSTONE SIGIL', 'MONOLITH CROWN'],
];

async function boot(search, store) {
    const sb = makeBrowserSandbox(store || {}); sb.location.search = search || '';
    sb.console = Object.assign({}, console, { error: (...a) => { if (!/the cards screen could not open/.test(String(a[0]))) console.error(...a); } });
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) { /* the page's own boot check says */ } }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; canvas.width = 1280; canvas.height = 860; if (typeof facilitySpawnTick === 'function') facilitySpawnTick = () => {};
        globalThis.__fresh = () => { actors = actors.filter(a => !a.isFollower && !(a instanceof Predator)); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); equipReset(); floatingTexts.length = 0; };
        // A SPOT: a point whose 13 × 13 tiles round it are all one room (the arena, as the map is today), so every unit below is in the Mage's room unless a check puts it in another (an aura stays in its room)
        globalThis.__P = (function(){ const F = _fp.F; for (const r of F.rooms) for (let x = Math.ceil(r.bb[0]); x <= r.bb[2]; x++) for (let y = Math.ceil(r.bb[1]); y <= r.bb[3]; y++) { let ok = true;
            for (let dx = -6.5; dx <= 6.5 && ok; dx += 0.5) for (let dy = -6.5; dy <= 6.5 && ok; dy += 0.5) if (facilityRoomAt(x + dx, y + dy, F) !== r) ok = false; if (ok) return [x, y, r.id]; } return null; })();
        globalThis.__at = (u, x, y) => { u.x = __P[0] + x; u.y = __P[1] + y; return u; };
        // a follower of a form at (x, y) from the spot, level 10, wearing up to two cards (found for the run, so the tick keeps them on)
        globalThis.__wear = (form, cards, x, y) => { const E = EVOLUTIONS[form]; spawnFollowerAtCrystal(E.element, E.role); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; f.role = E.role; f.evolved = form; f.element = E.element;
            initFollowerLevel(f, { level: 10 }); __at(f, x, y); const cs = (Array.isArray(cards) ? cards : [cards]).filter(Boolean); if (cs.length) { for (const c of cs) if (equipFound.indexOf(c) < 0) equipFound.push(c); f.cards = [cs[0], cs[1] || null]; equipRefresh(f); } f.health = f.maxHealth; return f; };
        globalThis.__clone = (x, y) => { const c = makeClone('ant', 'scout', __P[0] + x, __P[1] + y); c.health = c.maxHealth; return c; };
        globalThis.__foe = (species, x, y) => { const p = spawnCreature({ species, className: 'tank', x: __P[0] + x, y: __P[1] + y, level: 5, state: 'wander' }); p.fpCreature = true; p.homeRoom = 'arena'; p.spawnProtection = 0; p.health = p.maxHealth = 50000; p.element = null; p.reflectDamage = false; return p; };
        globalThis.__lost = (t, fn) => { const h = t.health; fn(); const d = h - t.health; t.health = t.maxHealth; return d; };
        globalThis.__said = w => floatingTexts.some(t => t.text === w);`);
    return { run, J, store: sb.localStorage, sb };
}

(async () => {
    const A = await boot('');
    const { run, J } = A;

    group('THE 21 NEW CARDS (their names approved: "Approve all 21")');
    check('18 Mage auras: six elements × Refined +5%, Precision +7.5%, Prototype +10% ATK; each a CLASS card for Mages that names its element; only the Prototype adds the element\'s status, at 10% (the owner raised the first guess of 5%); all dealt by Series 2', () => {
        const rows = J(`EQUIP_AURAS.map(r => { const c = EQUIP_CARDS[r[0]]; return [c.name, c.kind, c.match, c.aura.el, c.rarity, c.aura.attack, c.aura.status || 0, c.pack]; })`);
        same(rows.length, 18, 'the auras');
        AURAS.forEach(([el, a, b, p], i) => {
            same(rows[3 * i].join(), [a, 'class', 'sniper', el, 'refined', 0.05, 0, 'series2'].join(), el + ' Refined');
            same(rows[3 * i + 1].join(), [b, 'class', 'sniper', el, 'precision', 0.075, 0, 'series2'].join(), el + ' Precision');
            same(rows[3 * i + 2].join(), [p, 'class', 'sniper', el, 'prototype', 0.1, 0.1, 'series2'].join(), el + ' Prototype');
        });
    });
    check('3 Brawler opportunity cards: PRESSURE SPUR +20% (Refined), FAULTLINE TALON +30% (Precision), RUPTURE FANG +40% (Prototype); CLASS cards for Brawlers, dealt by Series 2', () => {
        same(J(`EQUIP_OPPORTUNITY.map(r => { const c = EQUIP_CARDS[r[0]]; return [c.name, c.kind, c.match, c.rarity, c.opportunity, c.pack].join(); })`).join('|'),
            'PRESSURE SPUR,class,brawler,refined,0.2,series2|FAULTLINE TALON,class,brawler,precision,0.3,series2|RUPTURE FANG,class,brawler,prototype,0.4,series2', 'the cards');
    });
    check('their words are made from their numbers: an aura names its share, its reach and (at Prototype) its status; an opportunity card its share and the four openings; an aura\'s kind reads CLASS · FIRE MAGE', () => {
        const r = J(`[EQUIP_CARDS.kindling_band.text, EQUIP_CARDS.inferno_crown.text, EQUIP_CARDS.eclipse_crown.text, EQUIP_CARDS.monolith_crown.text, EQUIP_CARDS.faultline_talon.text, equipKindLabel(EQUIP_CARDS.kindling_band), equipKindLabel(EQUIP_CARDS.pressure_spur)]`);
        same(r[0], 'AURA: +5% ATTACK TO EVERY FOLLOWER WITHIN 4 TILES IN ITS ROOM, AND THE CLONE', 'a Refined aura');
        same(r[1], 'AURA: +10% ATTACK TO EVERY FOLLOWER WITHIN 4 TILES IN ITS ROOM, AND THE CLONE · EACH OF THEIR HITS: 10% TO BURN', 'the fire Prototype');
        ok(/ 10% TO SIPHON$/.test(r[2]) && / 10% TO KNOCK BACK$/.test(r[3]), 'the flux and core Prototypes: ' + r[2] + ' / ' + r[3]);
        ok(/^OPPORTUNITY: \+30% ON A HIT FOR EACH WEAKNESS IT EXPLOITS/.test(r[4]) && /ELEMENT MATCH-UP/.test(r[4]) && /STUNNED OR SLEEPING/.test(r[4]), 'the opportunity words: ' + r[4]);
        same(r[5], 'CLASS · FIRE MAGE', 'an aura\'s kind'); same(r[6], 'CLASS · BRAWLER', 'an opportunity card\'s kind');
    });
    check('the Technician\'s family is Series 2\'s four cooldown cards, unchanged (SPARE PARTS KIT −8%, CAPACITOR BANK −14%, FIELD MULTITOOL −10% and +10% HP, DOUBLE CELL)', () => {
        same(J(`Object.values(EQUIP_CARDS).filter(c => c.kind === 'class' && c.match === 'camper' && c.pack === 'series2').map(c => c.id + ':' + JSON.stringify(c.bonus || c.ability))`).join('|'),
            'spare_parts_kit:{"cooldown":0.08}|capacitor_bank:{"cooldown":0.14}|field_multitool:{"cooldown":0.1,"maxHealth":0.1}|double_cell:{"kind":"doubleCharge"}', 'the four');
    });

    group('THE CUT CARDS AND THE RETIRED KIND');
    check('the eight Brawler and Mage class cards of Series 2 are no longer cards (EQUIP_CUT names them); the code of their abilities (Cleave, Chain) stays, worn by no card', () => {
        same(J('EQUIP_CUT').join(), CUT.join(), 'EQUIP_CUT'); same(J(`EQUIP_CUT.filter(id => !!EQUIP_CARDS[id] || !!equipCard(id)).length`), 0, 'a cut card is still a card');
        same(J(`Object.values(EQUIP_CARDS).filter(c => c.ability && (c.ability.kind === 'cleave' || c.ability.kind === 'chain')).length`), 0, 'a card still cleaves or chains');
        ok(/^CLEAVE:/.test(J(`equipAbilityText({ kind: 'cleave', radius: 1, share: 0.5 })`)), 'the Cleave words went');
    });
    check('no card is of the Universal kind, the test cards included; the two that were are PLAYER cards now (test_player_a, test_player_b), beside the Gunslinger\'s six roles (build 2026-11-02h) and the Technomancer\'s six (build 2026-11-02i)', () => {
        const B = J(`(function(){ equipDevSet('on'); const r = Object.values(equipCards()).map(c => c.id + ':' + c.kind); equipDevSet(''); return r; })()`);
        same(B.filter(x => /:universal$/.test(x)).length, 0, 'a Universal card'); same(B.filter(x => /:player$/.test(x)).join(), 'incendiary_gunner:player,blight_shooter:player,arc_slinger:player,cryo_marksman:player,rift_runner:player,breach_gunner:player,forgemaster:player,smog_engineer:player,arc_warden:player,cryo_tech:player,gravity_engineer:player,bulwark_engineer:player,ash_surgeon:player,plague_doctor:player,spark_geneticist:player,cryo_geneticist:player,splicer:player,core_shaper:player,test_player_a:player,test_player_b:player', 'the Player cards');
    });

    group('WHO WEARS WHAT');
    check('an aura fits a Mage of its element only: a fire Mage wears KINDLING BAND; an ice Mage, a fire Brawler and a fire Technician are told FOR FIRE MAGES; the player\'s slots refuse it (PLAYER CARDS ONLY)', () => {
        const r = J(`(function(){ __fresh(); equipFound.push('kindling_band'); const m = __wear('embercowl', null, 0, 0), i = __wear('rimestar', null, 1, 0), b = __wear('quillstone', null, 2, 0), t = __wear('thermite', null, 3, 0);
            return [equipWhyNot(m, 'kindling_band', 0), equipWhyNot(i, 'kindling_band', 0), equipWhyNot(b, 'kindling_band', 0), equipWhyNot(t, 'kindling_band', 0), equipPlayerWhyNot('kindling_band', 0)]; })()`);
        same(r[0], null, 'the fire Mage'); same(r.slice(1, 4).join('|'), 'FOR FIRE MAGES|FOR FIRE MAGES|FOR FIRE MAGES', 'the others'); same(r[4], 'PLAYER CARDS ONLY', 'the player');
    });
    check('an opportunity card fits a Brawler of any element only (FOR BRAWLERS); the player\'s slots take Player cards only, and a follower is told a Player card is FOR THE PLAYER', () => {
        const r = J(`(function(){ equipDevSet('on'); __fresh(); ['rupture_fang', 'test_player_a', 'test_fire'].forEach(id => equipFound.push(id)); const b = __wear('maw', null, 0, 0), m = __wear('voidstar', null, 1, 0);
            const o = [equipWhyNot(b, 'rupture_fang', 0), equipWhyNot(m, 'rupture_fang', 0), equipPlayerWhyNot('test_player_a', 0), equipPlayerWhyNot('test_fire', 0), equipPlayerWhyNot('rupture_fang', 1), equipWhyNot(b, 'test_player_a', 0), equipPlayerPut(0, 'test_player_a'), equipPlayer[0]];
            equipDevSet(''); return o; })()`);
        same(r[0], null, 'an ice Brawler'); same(r[1], 'FOR BRAWLERS', 'a Mage'); same(r[2], null, 'a Player card in the player\'s slot'); same(r[3] + '|' + r[4], 'PLAYER CARDS ONLY|PLAYER CARDS ONLY', 'other kinds in the player\'s slot');
        same(r[5], 'FOR THE PLAYER', 'a follower and a Player card'); same(r[6] + '|' + r[7], 'true|test_player_a', 'put in the player\'s slot');
    });

    group('THE MAGE AURAS');
    // a follower's ATK as its stats make it without any card or aura (an integer), and with: the card stat is kept to three places (js/levels.js)
    run(`globalThis.__atkWith = (f, k) => Math.max(1, Math.round(f.__atk0 * k * 1000) / 1000); globalThis.__base = f => { f.__atk0 = f.stats.attack; return f; };`);
    check('a fire Mage wearing KINDLING BAND: every follower within 4 tiles of it, of any element and class, the Mage too, has +5% ATK after the card tick; one 4.1 tiles off has none; SP.ATK is not touched', () => {
        const r = J(`(function(){ __fresh(); const m = __wear('embercowl', null, 0, 0), a = __base(__wear('maw', null, 3.9, 0)), b = __base(__wear('hammerslug', null, 0, 4.1)), c = __base(__wear('rotshard', null, 2.8, 2.8)); __base(m);
            const sp = [m.stats.specialAttack, a.stats.specialAttack]; m.cards = ['kindling_band', null]; equipFound.push('kindling_band'); equipRefresh(m); equipTick(true);
            return { m: [m.stats.attack, __atkWith(m, 1.05)], a: [a.stats.attack, __atkWith(a, 1.05)], b: [b.stats.attack, b.__atk0], c: [c.stats.attack, __atkWith(c, 1.05)], power: a.power === a.stats.attack, sp: sp.join() === [m.stats.specialAttack, a.stats.specialAttack].join(), au: a._aura && a._aura.attack }; })()`);
        same(r.m[0], r.m[1], 'the Mage itself'); same(r.a[0], r.a[1], 'an ice Brawler 3.9 tiles off'); same(r.c[0], r.c[1], 'a toxic Mage 3.96 tiles off'); same(r.b[0], r.b[1], 'a Technician 4.1 tiles off');
        same(r.power, true, 'its power (what the signature moves read) is not its ATK'); same(r.sp, true, 'SP.ATK moved'); same(r.au, 0.05, 'the aura it holds');
    });
    check('each tier\'s share: Precision +7.5%, Prototype +10%; added to a follower\'s own card (EMBER PLATING +5% on a fire Brawler and a Refined aura: +10%)', () => {
        const r = J(`(function(){ __fresh(); const m = __wear('rimestar', 'glacial_sigil', 0, 0), a = __base(__wear('maw', null, 1, 0)); a.cards = null; equipTick(true); const o = { prec: [a.stats.attack, __atkWith(a, 1.075)] };
            __fresh(); const m2 = __wear('hornshell', 'monolith_crown', 0, 0), b = __base(__wear('jellyram', null, 1, 0)); equipTick(true); o.proto = [b.stats.attack, __atkWith(b, 1.1)];
            __fresh(); const m3 = __wear('embercowl', 'kindling_band', 0, 0), q = __base(__wear('quillstone', null, 1, 0)); q.cards = ['ember_plating', null]; equipFound.push('ember_plating'); equipRefresh(q); equipTick(true); o.both = [q.stats.attack, __atkWith(q, 1.1), equipBonus(q, 'attack')]; return o; })()`);
        same(r.prec[0], r.prec[1], 'Precision'); same(r.proto[0], r.proto[1], 'Prototype'); same(r.both[0], r.both[1], 'a card and an aura'); ok(close(r.both[2], 0.1), 'the bonus summed: ' + r.both[2]);
    });
    check('different auras stack (a fire Mage\'s KINDLING BAND and an ice Mage\'s CHILL BAND: +10%); the same aura from two Mages counts once (+5%); two different cards on one Mage both count (KINDLING BAND and HEARTH SIGIL: +12.5%)', () => {
        const r = J(`(function(){ __fresh(); __wear('embercowl', 'kindling_band', 0, 0); __wear('rimestar', 'chill_band', 2, 0); const a = __base(__wear('maw', null, 1, 1)); equipTick(true); const o = { two: [a.stats.attack, __atkWith(a, 1.1), a._aura.cols.length] };
            __fresh(); __wear('embercowl', 'kindling_band', 0, 0); __wear('embercowl', 'kindling_band', 2, 0); const b = __base(__wear('maw', null, 1, 1)); equipTick(true); o.same = [b.stats.attack, __atkWith(b, 1.05), b._aura.attack];
            __fresh(); __wear('embercowl', ['kindling_band', 'hearth_sigil'], 0, 0); const c = __base(__wear('maw', null, 1, 1)); equipTick(true); o.pair = [c.stats.attack, __atkWith(c, 1.125)]; return o; })()`);
        same(r.two[0], r.two[1], 'two different auras'); same(r.two[2], 2, 'its glints (one a colour)'); same(r.same[0], r.same[1], 'the same aura twice'); same(r.same[2], 0.05, 'the share held'); same(r.pair[0], r.pair[1], 'two cards on one Mage');
    });
    check('leaving the reach takes the bonus off at the next card tick (half a second), coming back puts it on; the Mage falling, or taking the card off, ends it; nothing is added twice', () => {
        const r = J(`(function(){ __fresh(); const m = __wear('embercowl', 'kindling_band', 0, 0), a = __base(__wear('maw', null, 2, 0)), o = {}; equipTick(true); o.in = a.stats.attack;
            __at(a, 6, 0); equipTick(true); o.out = a.stats.attack; __at(a, 2, 0); equipTick(true); equipTick(true); o.back = a.stats.attack;
            m.dead = true; equipTick(true); o.fell = a.stats.attack; m.dead = false; equipTick(true); o.up = a.stats.attack; equipPut(m, 0, null); equipTick(true); o.off = [a.stats.attack, a._aura, m.stats.attack === m.__atk0 || !m.__atk0]; o.base = a.__atk0; o.want = __atkWith(a, 1.05); return o; })()`);
        same(r.in, r.want, 'in reach'); same(r.out, r.base, 'out of reach'); same(r.back, r.want, 'back in (twice ticked)'); same(r.fell, r.base, 'with its Mage down'); same(r.up, r.want, 'its Mage back'); same(r.off[0], r.base, 'the card taken off'); same(r.off[1], null, 'the aura it held');
    });
    check('the Mutator\'s clone in reach gets it: its hits do +5% (+10% under a Prototype aura) against the same hit out of reach; an enemy in reach never gets an aura', () => {
        const r = J(`(function(){ __fresh(); __wear('embercowl', 'kindling_band', 0, 0); const c = __clone(2, 0), t = __foe('ant', 2.5, 0.5), e = __foe('beetle', 1, 1); equipTick(true);
            const hit = () => __lost(t, () => applyDamage(t, 20, c, null, false, false, DMG_HIT_CLONE)); const o = { held: c._aura && c._aura.attack, foe: e._aura || null }; o.in = hit(); __at(c, 6.4, 0); equipTick(true); o.out = hit(); o.gone = c._aura;
            __fresh(); __wear('embercowl', 'inferno_crown', 0, 0); const c2 = __clone(1, 0), t2 = __foe('ant', 1.5, 0.5); equipTick(true); o.proto = __lost(t2, () => applyDamage(t2, 20, c2, null, false, false, DMG_HIT_CLONE)); return o; })()`);
        same(r.held, 0.05, 'the clone\'s aura'); same(r.foe, null, 'an enemy holds an aura'); same(r.gone, null, 'the clone kept it out of reach'); ok(r.out > 0 && close(r.in / r.out, 1.05, 1e-9), 'the clone\'s hit in reach / out: ' + r.in + ' / ' + r.out);
        ok(close(r.proto / r.out, 1.1, 1e-9), 'under a Prototype aura: ' + r.proto + ' / ' + r.out);
    });
    check('a Prototype aura\'s status: a follower in reach of INFERNO CROWN burns what it hits on a winning roll (10%), not on a losing one; one out of reach, and one under KINDLING BAND, never; the clone in reach does', () => {
        const r = J(`(function(){ const keep = Math.random; try { __fresh(); __wear('embercowl', 'inferno_crown', 0, 0); const a = __wear('maw', null, 2, 0), far = __wear('maw', null, 6, 0), c = __clone(1, 1); equipTick(true);
                const t = __foe('ant', 2.5, 0), t2 = __foe('ant', 6.4, 0), t3 = __foe('ant', 1.5, 1), o = {};
                Math.random = () => 0.099; applyDamage(t, 10, a, null, false, false, DMG_HIT_MAIN); o.win = t.burning > 0 || __said('BURN'); applyDamage(t2, 10, far, null, false, false, DMG_HIT_MAIN); o.far = t2.burning > 0;
                applyDamage(t3, 10, c, null, false, false, DMG_HIT_CLONE); o.clone = t3.burning > 0;
                Math.random = () => 0.101; const t4 = __foe('ant', 2.4, 0.4); applyDamage(t4, 10, a, null, false, false, DMG_HIT_MAIN); o.lose = t4.burning > 0;
                __fresh(); __wear('embercowl', 'kindling_band', 0, 0); const b = __wear('maw', null, 2, 0); equipTick(true); const t5 = __foe('ant', 2.5, 0); Math.random = () => 0; applyDamage(t5, 10, b, null, false, false, DMG_HIT_MAIN); o.refined = t5.burning > 0; return o;
            } finally { Math.random = keep; } })()`);
        same(r.win, true, 'no burn on a winning roll'); same(r.lose, false, 'a burn on a losing roll'); same(r.far, false, 'a burn out of reach'); same(r.clone, true, 'the clone did not burn'); same(r.refined, false, 'a Refined aura burned');
    });
    check('each element\'s Prototype sets its own status, with its Pack 1 Precision card\'s numbers: toxic poisons, electric glitches, ice slows, flux siphons (heals the hitter), core knocks back', () => {
        const r = J(`(function(){ const keep = Math.random; try { Math.random = () => 0; const o = {};
                for (const [mage, card] of [['rotshard', 'pestilence_crown'], ['thunderhead', 'tempest_crown'], ['rimestar', 'winter_crown'], ['voidstar', 'eclipse_crown'], ['hornshell', 'monolith_crown']]) {
                    __fresh(); __wear(mage, card, 0, 0); const a = __wear('maw', null, 2, 0); equipTick(true); const t = __foe('ant', 2.5, 0); a.health = a.maxHealth * 0.5; const h0 = a.health;
                    applyDamage(t, 10, a, null, false, false, DMG_HIT_MAIN); o[card] = [t.toxicWeakened > 0, t.glitched > 0, t.slowed > 0, a.health > h0, Math.abs(t.kbVX || 0) + Math.abs(t.kbVY || 0) > 0];
                } return o; } finally { Math.random = keep; } })()`);
        same(r.pestilence_crown[0], true, 'toxic did not poison'); same(r.tempest_crown[1], true, 'electric did not glitch'); same(r.winter_crown[2], true, 'ice did not slow'); same(r.eclipse_crown[3], true, 'flux did not siphon'); same(r.monolith_crown[4], true, 'core did not knock back');
    });
    // A RECORDER of what is drawn: each stroked ellipse (its size, colour, alpha, width, dash offset), each clip (its corners), each fill (a glint)
    run(`globalThis.__rec = () => { const o = { calls: [], clips: [], fills: 0 }, keep = {}; let el = null, pts = 0;
        const wrap = (k, fn) => { keep[k] = ctx[k]; ctx[k] = function(){ const r = fn.apply(this, arguments); return keep[k] ? keep[k].apply(this, arguments) : r; }; };
        wrap('beginPath', () => { pts = 0; }); wrap('moveTo', () => { pts++; }); wrap('lineTo', () => { pts++; }); wrap('clip', () => { o.clips.push(pts); });
        wrap('ellipse', function(x, y, rx, ry){ el = [x, y, rx, ry]; }); wrap('stroke', () => { if (el) o.calls.push({ x: el[0], y: el[1], rx: el[2], ry: el[3], col: ctx.strokeStyle, a: ctx.globalAlpha, w: ctx.lineWidth, off: ctx.lineDashOffset }); el = null; }); wrap('fill', () => { o.fills++; });
        o.done = () => { for (const k in keep) ctx[k] = keep[k]; }; o.clear = () => { o.calls.length = 0; o.clips.length = 0; o.fills = 0; }; return o; };`);
    check('THE LOOK (the owner: "It shouldn\'t show up on the walls either"): the ring is drawn ON THE FLOOR, tile by tile in the floor\'s pass (equipAuraOnTile), so the walls, props and units in front cover it: a tile it crosses draws its piece of a faint, thin dashed ellipse (4√2 tiles on the slant, the element\'s colour, alpha 0.22, turning), cut to the tile\'s diamond; a tile it does not cross draws nothing; the overlay draws only the glints; nothing at all with no aura', () => {
        const r = J(`(function(){ __fresh(); player.x = player.visualX = __P[0]; player.y = player.visualY = __P[1]; const R = __rec(); try {   // (the camera on the spot, for the glints)
                equipAuraOnTile(Math.round(__P[0] + 4), Math.round(__P[1]), 500, 300); equipAuraDraw(); const none = R.calls.length + R.fills;
                const m = __wear('embercowl', 'kindling_band', 0, 0); __wear('maw', null, 1, 0); equipTick(true); const T = (x, y) => equipAuraOnTile(Math.round(m.x + x), Math.round(m.y + y), 500, 300);
                frame = 100; R.clear(); T(4, 0); const first = R.calls.slice(), clips = R.clips.slice();
                R.clear(); T(1, 0); T(0, 2); T(6, 0); T(0, -6); const off = R.calls.length;
                frame = 200; R.clear(); T(4, 0); const turned = R.calls[0] && first[0] && R.calls[0].off !== first[0].off;
                R.clear(); equipAuraDraw(); const overlay = { ellipses: R.calls.length, glints: R.fills };
                return { none, first, clips, off, turned, overlay, want: [4 * Math.SQRT2 * TILE_W, 4 * Math.SQRT2 * TILE_H] }; } finally { R.done(); } })()`);
        same(r.none, 0, 'drawn with no aura');
        same(r.first.length, 1, 'strokes on a tile the ring crosses (one Mage, one colour)'); ok(close(r.first[0].rx, r.want[0], 1e-6) && close(r.first[0].ry, r.want[1], 1e-6), 'the ring\'s size: ' + JSON.stringify(r.first[0]));
        same(String(r.first[0].col).toLowerCase(), '#ff3300', 'its colour (fire)'); same(r.first[0].a, 0.22, 'its alpha'); same(r.first[0].w, 1.5, 'its width'); same(r.clips.join(), '4', 'it is not cut to the tile\'s diamond (four corners)');
        same(r.off, 0, 'a tile the ring does not cross drew it'); same(r.turned, true, 'it does not turn');
        same(r.overlay.ellipses, 0, 'the overlay still draws a ring (over the walls)'); same(r.overlay.glints, 2, 'the glints (two units)');
    });
    check('AN AURA STAYS IN ITS ROOM (the owner, 2026-11-02: "It shouldn\'t be displayed or affected in other rooms"): a follower and the clone 3 tiles from the Mage but through a wall, in the next room, get nothing; one in its room as far gets it', () => {
        const r = J(`(function(){ const F = _fp.F; let pair = null;   // a point in one room and one within 3 tiles in another (both rooms real)
            for (const ra of F.rooms) { if (pair) break; for (let x = Math.ceil(ra.bb[0]) + 1; x < ra.bb[2] && !pair; x++) for (let y = Math.ceil(ra.bb[1]) + 1; y < ra.bb[3] && !pair; y++) { if (facilityRoomAt(x, y, F) !== ra) continue;
                let other = null, same = null; for (let a = 0; a < 16; a++) { const qx = x + Math.cos(a * Math.PI / 8) * 3, qy = y + Math.sin(a * Math.PI / 8) * 3, q = facilityRoomAt(qx, qy, F); if (q && q !== ra && !other) other = [qx, qy, q.id]; if (q === ra && !same) same = [qx, qy]; }
                if (other && same) pair = { p: [x, y, ra.id], other, same }; } }
            if (!pair) return { none: true };
            __fresh(); const m = __wear('embercowl', 'kindling_band', 0, 0); m.x = pair.p[0]; m.y = pair.p[1]; const out = __wear('maw', null, 0, 0); out.x = pair.other[0]; out.y = pair.other[1]; const inn = __wear('quillstone', null, 0, 0); inn.x = pair.same[0]; inn.y = pair.same[1];
            const c = __clone(0, 0); c.x = pair.other[0]; c.y = pair.other[1]; equipTick(true);
            // the ring's tiles round the Mage: one in the next room draws nothing, one in its own room draws its piece
            let tOther = null, tSame = null; for (let a = 0; a < 64; a++) { const tx = Math.round(m.x + Math.cos(a * Math.PI / 32) * 4), ty = Math.round(m.y + Math.sin(a * Math.PI / 32) * 4), q = facilityRoomAt(tx, ty, F);
                if (q && q !== facilityRoomAt(m.x, m.y, F) && !tOther) tOther = [tx, ty]; if (q === facilityRoomAt(m.x, m.y, F) && !tSame) tSame = [tx, ty]; }
            const R = __rec(); let ring = null; try { if (tOther) equipAuraOnTile(tOther[0], tOther[1], 500, 300); const o = R.calls.length; R.clear(); if (tSame) equipAuraOnTile(tSame[0], tSame[1], 500, 300); ring = { other: tOther ? o : null, same: tSame ? R.calls.length : null }; } finally { R.done(); }
            return { rooms: [pair.p[2], pair.other[2]], out: out._aura || null, clone: c._aura || null, inn: inn._aura && inn._aura.attack, mage: m._aura && m._aura.attack, ring }; })()`);
        ok(!r.none, 'no two rooms within 3 tiles of each other were found');
        same(r.out, null, 'a follower in the next room (' + r.rooms.join(' / ') + ') got the aura'); same(r.clone, null, 'the clone in the next room got it'); same(r.inn, 0.05, 'a follower in its room 3 tiles off'); same(r.mage, 0.05, 'the Mage');
        ok(r.ring && r.ring.other !== null, 'no tile of the next room on the ring was found'); same(r.ring.other, 0, 'the ring was drawn on a tile of the next room'); ok(r.ring.same === null || r.ring.same > 0, 'the ring was not drawn on a tile of its own room');
    });

    group('THE BRAWLER\'S OPPORTUNITY');
    // the same hit with and without the card: the ratio is 1 + share × openings (a Quillstone: fire, its main attack PIERCING, its signature move PROJECTILE)
    run(`globalThis.__ratio = (form, card, foe, prep, hit) => { __fresh(); const b = __wear(form, null, 0, 0), t = __foe(foe, 0.6, 0); if (prep) prep(t); const h = hit || DMG_HIT_MAIN;
        const without = __lost(t, () => applyDamage(t, 10, b, null, false, false, h)); b.cards = [card, null]; equipFound.push(card); equipRefresh(b); t._dmgWordAt = undefined; const withIt = __lost(t, () => applyDamage(t, 10, b, null, false, false, h)); return withIt / without; };`);
    check('a hit that exploits no weakness is unchanged (a Quillstone\'s piercing bite on an ant with no element: the ant is not weak to piercing and resists Elemental)', () => {
        ok(close(J(`__ratio('quillstone', 'pressure_spur', 'ant', null)`), 1, 1e-9), 'the ratio');
    });
    check('each opening alone adds the card\'s +20%: a race weak to the hit\'s physical type (a spider, to piercing); a race weak to Elemental (a scorpion); an element match-up (fire on a flux target); a stunned target; a sleeping one', () => {
        const r = J(`[__ratio('quillstone', 'pressure_spur', 'spider', null), __ratio('quillstone', 'pressure_spur', 'scorpion', null), __ratio('quillstone', 'pressure_spur', 'ant', t => { t.element = 'flux'; }),
            __ratio('quillstone', 'pressure_spur', 'ant', t => { t.stunned = 120; }), __ratio('quillstone', 'pressure_spur', 'ant', t => { t.asleep = 120; t.stunned = 0; })]`);
        ['physical type', 'Elemental', 'element match-up', 'stunned', 'asleep'].forEach((w, i) => ok(close(r[i], 1.2, 1e-9), w + ': ' + r[i]));
    });
    check('a glitched target is not an opening (it still walks); a race resisting the hit is not one either (a Static Orb\'s crushing hit on a mantis, which resists crushing), nor an element the hitter is weak against (electric on an ice mantis)', () => {
        const r = J(`[__ratio('quillstone', 'pressure_spur', 'ant', t => { t.glitched = 120; }), __ratio('staticorb', 'pressure_spur', 'mantis', null), __ratio('staticorb', 'pressure_spur', 'mantis', t => { t.element = 'ice'; })]`);
        ok(close(r[0], 1, 1e-9), 'glitched: ' + r[0]); ok(close(r[1], 1, 1e-9), 'a mantis: ' + r[1]); ok(close(r[2], 1, 1e-9), 'electric on ice: ' + r[2]);
    });
    check('openings add up: two (a spider, stunned) +40%; all four on one hit with RUPTURE FANG (a Quillstone\'s PROJECTILE signature move on a stunned flux moth, weak to projectile and to Elemental) +160%; FAULTLINE TALON, one opening, +30%', () => {
        const r = J(`[__ratio('quillstone', 'pressure_spur', 'spider', t => { t.stunned = 120; }), __ratio('quillstone', 'rupture_fang', 'moth', t => { t.element = 'flux'; t.stunned = 120; }, DMG_HIT_ALT), __ratio('quillstone', 'faultline_talon', 'spider', null)]`);
        ok(close(r[0], 1.4, 1e-9), 'two openings: ' + r[0]); ok(close(r[1], 2.6, 1e-9), 'four openings: ' + r[1]); ok(close(r[2], 1.3, 1e-9), 'Precision: ' + r[2]);
    });
    check('ice on core: the elemental part does nothing and is no opening; on a stunned core target the +20% falls on the physical part that lands (an ice Maw)', () => {
        const r = J(`[__ratio('maw', 'pressure_spur', 'ant', t => { t.element = 'core'; }), __ratio('maw', 'pressure_spur', 'ant', t => { t.element = 'core'; t.stunned = 120; })]`);
        ok(close(r[0], 1, 1e-9), 'no opening: ' + r[0]); ok(close(r[1], 1.2, 1e-9), 'stunned: ' + r[1]);
    });
    check('on anyone but a Brawler it does nothing (forced into a Mage\'s slot it does not fit); a hit with no type (an echo, a burn) never asks', () => {
        const r = J(`(function(){ __fresh(); const m = __wear('embercowl', null, 0, 0), t = __foe('spider', 0.6, 0); t.stunned = 120; const a = __lost(t, () => applyDamage(t, 10, m, null, false, false, DMG_HIT_SHOT)); m.cards = ['rupture_fang', null]; const b = __lost(t, () => applyDamage(t, 10, m, null, false, false, DMG_HIT_SHOT)); return [b / a, equipOpportunity(m)]; })()`);
        ok(close(r[0], 1, 1e-9), 'a Mage: ' + r[0]); same(r[1], 0, 'a Mage\'s opportunity');
    });

    group('SERIES 2 RESHAPED');
    check('the pack deals 63 cards: the 20 species cards, the Technician\'s 4, the 18 auras, the 3 opportunity cards and, since the following update\'s Part 1d, the 18 Player cards (Unrefined 6, Refined 13, Precision 13, Prototype 31); its price and odds are unchanged (◆150; 50 / 30 / 15 / 5, one Precision or better)', () => {
        const r = J(`(function(){ const pool = equipPackPool(EQUIP_PACK2), by = {}; pool.forEach(c => by[c.rarity] = (by[c.rarity] || 0) + 1); return { n: pool.length, sub: pool.filter(c => c.kind === 'subclass').length, tech: pool.filter(c => c.match === 'camper').length, aura: pool.filter(c => c.aura).length, opp: pool.filter(c => c.opportunity).length, player: pool.filter(c => c.kind === 'player').length, by, price: EQUIP_PACK2.price, odds: EQUIP_PACK2.rarities, g: EQUIP_PACK2.guaranteed }; })()`);
        same(r.n, 63, 'its cards'); same([r.sub, r.tech, r.aura, r.opp, r.player].join(), '20,4,18,3,18', 'species, Technician, auras, opportunity, Player cards'); same(JSON.stringify(r.by), '{"unrefined":6,"refined":13,"precision":13,"prototype":31}', 'by rarity');
        same(r.price, 150, 'its price'); same(JSON.stringify(r.odds), '{"unrefined":50,"refined":30,"precision":15,"prototype":5}', 'its odds'); same(JSON.stringify(r.g), '{"rarity":"precision","count":1,"orHigher":true}', 'its guarantee');
    });
    check('20,000 seeded packs (once purified) never deal a cut card, deal every one of the 63 (the 18 Player cards among them), each pack four different cards with one Precision or better; the market\'s shelf never offers a cut card', () => {
        const r = J(`(function(){ const keep = questDone; questDone = q => q === 'purify' || keep(q); try { const seen = new Set(); let bad = 0, cut = 0, n = 0;
                for (let s = 1; s <= 20000; s++) { const ids = equipPackRoll(s, EQUIP_PACK2); if (!ids) { bad++; continue; } n++; ids.forEach(id => { seen.add(id); if (EQUIP_CUT.indexOf(id) >= 0) cut++; });
                    if (new Set(ids).size !== 4 || !ids.some(id => ['precision', 'prototype'].indexOf(EQUIP_CARDS[id].rarity) >= 0)) bad++; }
                let shelfCut = 0; for (let s = 1; s <= 300; s++) { equipShelfDeal(s); if (equipShelf.ids.some(id => EQUIP_CUT.indexOf(id) >= 0)) shelfCut++; }
                return { n, bad, cut, seen: seen.size, players: [...seen].filter(id => EQUIP_CARDS[id].kind === 'player').length, shelfCut }; } finally { questDone = keep; } })()`);
        same(r.n, 20000, 'packs made'); same(r.bad, 0, 'bad packs'); same(r.cut, 0, 'cut cards dealt'); same(r.seen, 63, 'cards ever dealt'); same(r.players, 18, 'Player cards ever dealt'); same(r.shelfCut, 0, 'shelves with a cut card');
    });

    group('THE OLD SAVES\' CLEAN-UP AND THE REFUND (paid once)');
    run(`globalThis.__coll = d => { localStorage.setItem(EQUIP.key, typeof d === 'string' ? d : JSON.stringify(d)); _equipOwned = null; return equipOwnedSet(); };`);
    check('a collection holding three cut cards and two others: on load the cut cards leave it, in the same write that keeps ◆3,000 owed; loading again owes no more', () => {
        const r = J(`(function(){ const set = __coll({ v: 1, owned: ['ember_plating', 'knuckle_wraps', 'focus_lens', 'chain_conduit', 'impact_test'] }); const kept = JSON.parse(localStorage.getItem(EQUIP.key)), due = equipRefundDue();
            _equipOwned = null; equipOwnedSet(); return { set: [...set], kept, due, again: equipRefundDue(), kept2: JSON.parse(localStorage.getItem(EQUIP.key)) }; })()`);
        same(r.set.join(), 'ember_plating,impact_test', 'the collection'); same(r.kept.owned.join(), 'ember_plating,impact_test', 'the record'); same(r.kept.refund, 3000, 'the refund kept'); same(r.due, 3000, 'owed');
        same(r.again, 3000, 'owed after a second load'); same(r.kept2.refund, 3000, 'kept after a second load');
    });
    check('it is paid on the next card tick of a run in play: +◆3,000 to the run\'s shards, a line says so, the record forgets it, the run is saved at once; a second tick, and a reload, pay nothing', () => {
        const r = J(`(function(){ __coll({ v: 1, owned: ['ember_plating', 'iron_guard', 'cleaver_arm', 'spellweave_circlet'] }); shardCount = 100; floatingTexts.length = 0; _fp.saveReady = true; gameState.running = true; equipTick(true);
            const o = { shards: shardCount, said: floatingTexts.map(t => t.text).filter(t => /BACK/.test(t)), rec: JSON.parse(localStorage.getItem(EQUIP.key)), saved: JSON.parse(localStorage.getItem('conduit_fp_save') || 'null') };
            equipTick(true); o.second = shardCount; _equipOwned = null; equipTick(true); o.reload = shardCount; o.due = equipRefundDue(); return o; })()`);
        same(r.shards, 3100, 'the shards'); same(r.said.join(), '◆3000 BACK · 3 SERIES 2 CARDS YOU OWNED WERE CUT', 'the line'); same(r.rec.refund, undefined, 'the record still owes'); same(r.rec.owned.join(), 'ember_plating', 'the record');
        ok(r.saved && r.saved.shards === 3100, 'the run was not saved with the shards: ' + (r.saved && r.saved.shards)); same(r.second, 3100, 'a second tick paid'); same(r.reload, 3100, 'a reload paid'); same(r.due, 0, 'still owed');
    });
    check('it waits while no run is in play (before the run begins, after it is over) and is paid when one is; ?cards=all neither pays nor writes it', () => {
        const r = J(`(function(){ __coll({ v: 1, owned: ['haymaker_gauntlet'] }); shardCount = 0; const o = {}; _fp.saveReady = false; equipTick(true); o.before = [shardCount, equipRefundDue()]; _fp.saveReady = true; gameState.running = false; equipTick(true); o.over = shardCount;
            gameState.running = true; equipTick(true); o.paid = shardCount;
            localStorage.setItem(EQUIP.key, JSON.stringify({ v: 1, owned: ['channeling_rod'] })); equipDevSet('all'); shardCount = 0; equipTick(true); o.all = [shardCount, JSON.parse(localStorage.getItem(EQUIP.key)).owned.join()]; equipDevSet(''); return o; })()`);
        same(r.before.join(), '0,1000', 'before the run'); same(r.over, 0, 'with the run over'); same(r.paid, 1000, 'in play'); same(r.all.join(), '0,channeling_rod', '?cards=all');
    });
    check('it is safe on malformed collections: a refund not a positive number is not believed, one above the most there could be (◆8,000) is cut to it, a record not ours or not JSON is an empty collection; nothing throws', () => {
        const r = J(`(function(){ const o = {}; const due = d => { try { __coll(d); return equipRefundDue(); } catch (e) { return 'THREW ' + e.message; } };
            o.str = due({ v: 1, owned: [], refund: 'lots' }); o.neg = due({ v: 1, owned: [], refund: -5 }); o.huge = due({ v: 1, owned: ['knuckle_wraps'], refund: 1e12 }); o.frac = due({ v: 1, owned: [], refund: 1500.7 });
            o.v2 = due({ v: 2, owned: ['knuckle_wraps'], refund: 4000 }); o.junk = due('{not json'); o.mixed = due({ v: 1, owned: [7, null, 'focus_lens', { a: 1 }, 'focus_lens'] }); o.notArr = due({ v: 1, owned: 'focus_lens' }); o.nul = due('null'); return o; })()`);
        same(r.str, 0, 'a string'); same(r.neg, 0, 'a negative'); same(r.huge, 8000, 'a huge one'); same(r.frac, 1500, 'a fraction'); same(r.v2, 0, 'not ours'); same(r.junk, 0, 'not JSON'); same(r.mixed, 1000, 'a mixed list (one cut card, twice)'); same(r.notArr, 0, 'owned not a list'); same(r.nul, 0, 'null');
    });
    check('a run\'s save holding cut cards loads without them: the hand, the cards found, the shelf, the player\'s slots, a follower\'s slots (its bonus gone at once, the slot empty after the tick); a cut card only found pays nothing', () => {
        const r = J(`(function(){ __coll({ v: 1, owned: ['ember_plating'] }); __fresh(); shardCount = 0; equipSaveApply({ hand: ['ember_plating', 'knuckle_wraps'], found: ['iron_guard', 'chitin_scale'], player: ['focus_lens', null], credits: 0, shelf: { ids: ['cleaver_arm', 'raw_shard'], left: 100 } });
            const b = __wear('quillstone', null, 0, 0); b.__atk0 = b.stats.attack; equipRestore(b, ['knuckle_wraps', 'iron_guard']); equipRefresh(b); const o = { hand: equipHand.slice(), found: equipFound.slice(), player: equipPlayer.slice(), shelf: equipShelf.ids.slice(), atk: [b.stats.attack, b.__atk0], bonus: equipBonus(b, 'attack') };
            equipTick(true); o.slots = b.cards || null; o.shards = shardCount; return o; })()`);
        same(r.hand.join(), 'ember_plating', 'the hand'); same(r.found.join(), 'chitin_scale', 'the found'); same(r.player.join(), ',', 'the player\'s slots'); same(r.shelf.join(), 'raw_shard', 'the shelf');
        same(r.atk[0], r.atk[1], 'a cut card\'s bonus counted'); same(r.bonus, 0, 'the bonus'); same(r.slots, null, 'the slots after the tick'); same(r.shards, 0, 'a found card paid');
    });

    group('THE PAGE');
    check('the hooks are where the game makes the numbers: the overlays draw the auras; applyDamage gives the clone its aura and lets the aura\'s holders reach equipOnHit; dmgApply asks equipOpportunity; the card tick works out the auras and pays the refund', () => {
        ok(/equipAuraDraw\(\)/.test(rd('js/game.js')), 'the overlays (the glints)'); ok(/obj\.type==='floor'[\s\S]{0,1800}equipAuraOnTile\(obj\.x, obj\.y, px, py\)/.test(rd('js/game.js')), 'the floor pass does not draw the ring'); ok(/source\.isClone && source\.team === "green" && source\._aura/.test(rd('js/helpers.js')), 'the clone\'s aura');
        ok(/\(source\.isFollower && \(source\.cards \|\| source\._aura\)\) \|\| \(source\.isClone && source\._aura\)/.test(rd('js/helpers.js')), 'equipOnHit\'s door (a follower with cards or an aura; the clone with an aura only)'); ok(/equipOpportunity\(source\)/.test(rd('js/damage.js')), 'dmgApply');
        ok(/_equipAuraTick\(\);[\s\S]{0,120}equipRefundTick\(\);/.test(rd('js/cards.js')), 'the tick');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
