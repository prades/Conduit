// THE DAMAGE SYSTEM (docs/COMBAT.md §7; js/damage.js, js/helpers.js applyDamage, js/levels.js _applyFollowerLevel).
// ASKED (the owner, 2026-11-02): six damage types; each race and each follower subclass weak to some (×1.3), resisting some (×0.7); "every single one of their
// attacks is half special and half physical ... And special attack is basically elemental damage." Every rule below is the owner's (docs/COMBAT.md §7.2 to §7.8):
//   THE TABLES    the six types, the race chart, the subclass chart, every form's attacks, the retired forms
//   THE SPLIT     a follower's hit is its number × (½ ATK + ½ SP.ATK), an Elemental attack ¼ and ¾; SP.ATK lifts only the elemental part; the retune keeps a class's average
//   THE ROWS      the physical part by its type, the elemental part by Elemental and the element triangle; ice on core: the elemental part does nothing
//   THE STATS     evolving raises SP.ATK too; each form's lean
//   THE OTHERS    an enemy's hit (half and half when it has an element), a clone's bite, the player's hits
//   THE WORDS     a word for each part that met a weakness or a resistance
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
function near(a, b, m, eps) { if (!(Math.abs(a - b) <= (eps || 1e-6))) throw new Error(`${m}: expected ${b}, got ${a}`); }
function sameJSON(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    // a stand-in follower (the numbers are what dmgApply reads) and a stand-in target (a race, an element, or neither)
    run(`globalThis.__src = (o) => Object.assign({ isFollower: true, role: 'brawler', element: 'fire', evolved: 'quillstone', stats: { attack: 20, specialAttack: 10 } }, o || {});
         globalThis.__tgt = (o) => Object.assign({ x: 0, y: 0 }, o || {});
         globalThis.__noWords = () => { floatingTexts.length = 0; };`);

    // ENERGY POWER (js/energy.js, build 2026-11-13y) is checked on its own first; the rest of this suite is the damage system at the baseline, ONE card of its element (power 1), as it was before the rule
    group('ENERGY POWER: an evolved follower\'s cards of its own element scale the ELEMENTAL part of its hits (the owner, 2026-11-13: 25 / 100 / 125 / 150%; "Hit damage only")');
    check('with none, one, two and three cards of its element the elemental part of an everyday hit and of a move is 0.25, 1, 1.25 and 1.5 of the baseline and the physical part does not move; a card of another element adds nothing; an Ultimate\'s hit (a special) is not scaled; an unevolved follower is not scaled', () => {
        const r = J(`(function(){ spawnFollowerAtCrystal('fire', 'brawler'); const f = followers[followers.length - 1]; f.evolved = 'quillstone'; f.level = 20; _applyFollowerLevel(f, true);
            const S = SPECIES.ant, mk = () => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 5, 5); p.speciesName = 'ant'; p.team = 'red'; p.health = p.maxHealth = 1e9; return p; };
            const split = (cards, hit) => { f.energy = cards; return dmgApply(mk(), 20, f, 'fire', hit); };   /* (what lands on an ant: its physical part x its row, plus its elemental part x the power x the ant's Elemental row) */
            const o = {};
            o.main = [[null, null, null], ['fire', null, null], ['fire', 'fire', null], ['fire', 'fire', 'fire']].map(c => split(c, DMG_HIT_MAIN)); o.alt = [[null, null, null], ['fire', null, null], ['fire', 'fire', null], ['fire', 'fire', 'fire']].map(c => split(c, DMG_HIT_ALT));
            o.other = split(['ice', 'ice', 'ice'], DMG_HIT_MAIN); o.mixed = split(['fire', 'ice', 'ice'], DMG_HIT_MAIN); o.special = [split([null, null, null], DMG_HIT_SPECIAL), split(['fire', 'fire', 'fire'], DMG_HIT_SPECIAL)];
            delete f.evolved; f.energy = ['fire']; o.egg = energyPower(f); followers.splice(followers.indexOf(f), 1); actors = actors.filter(a => a !== f); return o; })()`);
        // the hit is P + k x E for a power k: so from none (0.25) to one (1), two (1.25) and three (1.5) cards it grows by 0.75 E, 1 E and 1.25 E
        for (const [nm, T] of [['everyday', r.main], ['a move', r.alt]]) { const E = (T[1] - T[0]) / 0.75; ok(E > 0, nm + ': a card of its element added nothing: ' + T); near(T[2] - T[0], E, nm + ', two cards', 1e-6); near(T[3] - T[0], 1.25 * E, nm + ', three cards', 1e-6); ok(T[0] - 0.25 * E > 0, nm + ': no physical part left: ' + T); }
        near(r.other, r.main[0], 'three ICE cards on a FIRE form gave power', 1e-9); near(r.mixed, r.main[1], 'one FIRE and two ICE cards: one card\'s power', 1e-9);
        near(r.special[0], r.special[1], 'an Ultimate\'s hit was scaled', 1e-9); ok(r.egg === 1, 'an unevolved follower\'s power: ' + r.egg);
    });
    run('energyPower = () => 1;');   // (from here on: the baseline)

    group('THE TABLES (docs/COMBAT.md §7.2, §7.3, §7.4, §7.8)');
    check('six damage types', () => sameJSON(J('DMG_TYPES'), ['slashing', 'piercing', 'projectile', 'crushing', 'earthquake', 'elemental'], 'the types'));
    check('the race chart is the owner\'s, ✦ sharpenings included (beetle weak to Piercing, moth to Projectile)', () => {
        const R = J('DMG_RACE');
        sameJSON(R.ant, { weak: ['crushing', 'earthquake'], resist: ['elemental'] }, 'ant');
        sameJSON(R.beetle, { weak: ['crushing', 'earthquake', 'piercing'], resist: ['slashing', 'projectile'] }, 'beetle');
        sameJSON(R.scorpion, { weak: ['elemental'], resist: ['slashing', 'piercing', 'projectile'] }, 'scorpion');
        sameJSON(R.spider, { weak: ['slashing', 'piercing', 'projectile'], resist: ['elemental'] }, 'spider');
        sameJSON(R.mantis, { weak: ['slashing', 'piercing', 'projectile'], resist: ['crushing', 'earthquake'] }, 'mantis');
        sameJSON(R.moth, { weak: ['elemental', 'projectile'], resist: ['crushing', 'earthquake'] }, 'moth');
    });
    check('the subclass chart: two weaknesses and two resistances each, as drafted and approved', () => {
        const S = J('DMG_SUBCLASS');
        sameJSON(S.spinelegged, { weak: ['crushing', 'earthquake'], resist: ['slashing', 'piercing'] }, 'spine-legged (the Crustacean, renamed)');
        sameJSON(S.mollusk, { weak: ['slashing', 'piercing'], resist: ['crushing', 'earthquake'] }, 'mollusk');
        sameJSON(S.elemental, { weak: ['earthquake', 'projectile'], resist: ['slashing', 'elemental'] }, 'elemental');
        sameJSON(S.drone, { weak: ['crushing', 'elemental'], resist: ['piercing', 'projectile'] }, 'drone');
        sameJSON(S.jelly, { weak: ['slashing', 'elemental'], resist: ['crushing', 'projectile'] }, 'jelly');
    });
    check('every form in the game has its attacks; every retired form maps to a form that is not retired', () => {
        const r = J(`(function(){ const miss = [], bad = []; for (const k in EVOLUTIONS) { const d = EVOLUTIONS[k]; if (d.legacy) { const to = DMG_RETIRED[k]; if (!to || !EVOLUTIONS[to] || EVOLUTIONS[to].legacy) bad.push(k); } else if (!DMG_FORM[k]) miss.push(k); } return { miss, bad }; })()`);
        sameJSON(r, { miss: [], bad: [] }, 'missing forms, bad retired maps');
    });
    check('the followers\' attack table (§7.4): main and alternate types of all eighteen forms', () => {
        const T = J(`(function(){ const o = {}; for (const k in DMG_FORM) o[k] = [dmgFormType({ evolved: k, role: EVOLUTIONS[k].role }, 'main'), dmgFormType({ evolved: k, role: EVOLUTIONS[k].role }, 'alt')]; return o; })()`);
        const want = { quillstone: ['piercing', 'projectile'], maw: ['slashing', 'piercing'], staticorb: ['crushing', 'piercing'], seeper: ['slashing', 'earthquake'], mimic: ['slashing', 'earthquake'],
            thunderhead: ['elemental', 'elemental'], voidstar: ['elemental', 'elemental'], embercowl: ['elemental', 'elemental'], rimestar: ['projectile', 'projectile'], hornshell: ['projectile', 'elemental'],
            rotshard: ['projectile', 'elemental'], thermite: ['piercing', 'crushing'], blightspider: ['piercing', 'elemental'], hovershell: ['crushing', 'earthquake'], igloo: ['crushing', 'elemental'] };
        for (const k in want) sameJSON(T[k], want[k], k);
        sameJSON([T.jellyram[0], T.hammerslug[0], T.gooproxy[0]], ['crushing', 'piercing', 'crushing'], 'the Core\'s and the Flux\'s mains');
    });
    check('THE FOUR TYPES PER ELEMENT (the owner, 2026-11-13: "each damage type, represented like piercing, slashing, crushing and magic or elemental"; builds 2026-11-13j and k): each element\'s forms cover the four among their main and alternate attacks, EXCEPT these gaps, left until the owner says where each goes (Jelly Ram\'s ram, Thermite\'s spikes, Goo Proxy\'s slam and Seeper\'s eruption were put back to what they were: "you can change"): core Slashing, fire Slashing, flux Piercing, toxic Crushing, blossom Slashing', () => {
        const r = J(`(function(){ const m = {}; for (const k of Object.keys(EVOLUTIONS)) { const d = EVOLUTIONS[k]; if (d.legacy || !d.role) continue; const t = DMG_FORM[k]; (m[d.element] = m[d.element] || new Set()).add(t.main).add(t.alt); if (t.extra) m[d.element].add(t.extra); } const o = []; for (const e of Object.keys(m).sort()) for (const x of ['slashing', 'piercing', 'crushing', 'elemental']) if (!m[e].has(x)) o.push(e + ' ' + x); return o; })()`);
        ok(r.join() === '', 'an element lacks a type (the five gaps were filled by the extra attacks, builds 2026-11-13v and w): ' + r.join());
    });
    check('an element special is Elemental for everyone; an egg hits with its scythe legs (Slashing), an egg Mage\'s shot is a shot', () => {
        ok(J(`dmgFormType({ evolved: 'maw', role: 'brawler' }, 'special')`) === 'elemental', 'special');
        ok(J(`dmgFormType({ role: 'brawler' }, 'main')`) === 'slashing', 'egg brawler');
        ok(J(`dmgFormType({ role: 'camper' }, 'main')`) === 'slashing', 'egg technician');
        ok(J(`dmgFormType({ role: 'sniper' }, 'main')`) === 'projectile', 'egg mage shot');
    });
    check('a retired form copies its replacement (BUNKER BLOOM as QUILLSTONE, PETAL BLAZE Elemental; REAVER as THUNDERHEAD), its row too', () => {
        ok(J(`dmgFormType({ evolved: 'bloom', role: 'brawler' }, 'main')`) === 'piercing', 'bloom main');
        ok(J(`dmgFormType({ evolved: 'bloom', role: 'brawler' }, 'alt')`) === 'elemental', 'PETAL BLAZE');
        ok(J(`dmgFormType({ evolved: 'reaver', role: 'sniper' }, 'main')`) === 'elemental', 'reaver');
        ok(J(`dmgSubclass({ evolved: 'caldera' })`) === 'spinelegged', 'caldera takes SEEPER\'s subclass');
        ok(J(`dmgLean({ evolved: 'halo' })`) === 2, 'CINDER HALO takes EMBER HOOD\'s lean');
    });

    group('THE SPLIT (docs/COMBAT.md §7.6)');
    check('a half-and-half attack: the elemental share of the hit is SP.ATK ÷ (ATK + SP.ATK)', () => {
        const r = J(`(function(){ __noWords(); const s = __src(), t = __tgt(); const all = dmgApply(t, 10, s, 'fire', DMG_HIT_MAIN); const s2 = __src({ stats: { attack: 20, specialAttack: 0.000001 } }); return { all, k: 10 / 20 * dmgNorm(s, 'atk', 0.5) }; })()`);
        // phys = k × ½ × 20, elem = k × ½ × 10: the elemental share is 10 / 30
        near(r.all, r.k * 0.5 * 20 + r.k * 0.5 * 10, 'the total', 1e-9);
    });
    check('an Elemental attack (THUNDERHEAD\'s shot) leans elemental: ¼ ATK and ¾ SP.ATK', () => {
        const r = J(`(function(){ const s = __src({ role: 'sniper', element: 'electric', evolved: 'thunderhead', stats: { attack: 10, specialAttack: 15 } }), t = __tgt(); const k = 10 / 15 * dmgNorm(s, 'sp', 0.75); return { all: dmgApply(t, 10, s, 'electric', DMG_HIT_SHOT), want: k * 0.25 * 10 + k * 0.75 * 15 }; })()`);
        near(r.all, r.want, 'the total', 1e-9);
    });
    check('raising SP.ATK raises only the elemental part: a +10% SP.ATK lifts a Brawler\'s hit less than a Mage\'s Elemental shot', () => {
        const r = J(`(function(){ const t = __tgt();
            const b = s => dmgApply(t, 10 / 18 * s.stats.attack, s, 'ice', DMG_HIT_MAIN), m = s => dmgApply(t, 10 / 15 * s.stats.specialAttack, s, 'electric', DMG_HIT_SHOT);   // (a shot's number reads SP.ATK, as the game's does)
            const B0 = __src({ evolved: 'maw', element: 'ice', stats: { attack: 18, specialAttack: 6 } }), B1 = __src({ evolved: 'maw', element: 'ice', stats: { attack: 18, specialAttack: 6.6 } });
            const M0 = __src({ role: 'sniper', evolved: 'thunderhead', element: 'electric', stats: { attack: 10, specialAttack: 15 } }), M1 = __src({ role: 'sniper', evolved: 'thunderhead', element: 'electric', stats: { attack: 10, specialAttack: 16.5 } });
            return { brawler: b(B1) / b(B0) - 1, mage: m(M1) / m(M0) - 1 }; })()`);
        near(r.brawler, 0.025, 'a wild Brawler\'s main attack: +2.5%', 1e-6);
        ok(r.mage > 0.07 && r.mage < 0.09, 'a cunning Mage\'s Elemental shot: about +8% (got ' + r.mage + ')');
    });
    check('the retune: at its class\'s average stats, an attack does what it did when it read one stat', () => {
        const r = J(`(function(){ const t = __tgt(), out = [];
            for (const role of ['brawler', 'sniper', 'camper']) { const m = _dmgClassMeans(role);
                const s = __src({ role, evolved: null, stats: { attack: m.a, specialAttack: m.s } });
                out.push(dmgApply(t, 2 * m.a, s, null, DMG_HIT_MAIN) / (2 * m.a), dmgApply(t, 2 * m.s, s, null, DMG_HIT_SPECIAL) / (2 * m.s)); }
            return out; })()`);
        for (const x of r) near(x, 1, 'the class average is kept', 1e-9);
    });
    check('the retune evens out each form\'s lean (§7.7): an evolved form at its class\'s average stats does what it did before (ATK attacks ×EVOLVE_MULT, SP.ATK ones not)', () => {
        const r = J(`(function(){ const t = __tgt(), out = {};
            for (const [id, role] of [['quillstone', 'brawler'], ['maw', 'brawler'], ['staticorb', 'brawler'], ['thunderhead', 'sniper'], ['hornshell', 'sniper'], ['hammerslug', 'camper'], ['igloo', 'camper'], ['bloom', 'brawler']]) {
                const m = _dmgClassMeans(role), L = dmgLean({ evolved: id }) * DMG_LEAN_STEP;
                const s = __src({ role, evolved: id, stats: { attack: m.a * EVOLVE_MULT * (1 - L), specialAttack: m.s * EVOLVE_MULT * (1 + L) } });
                out[id] = [dmgApply(t, 2 * s.stats.attack, s, null, DMG_HIT_MAIN) / (2 * m.a * EVOLVE_MULT), dmgApply(t, 2 * s.stats.attack, s, null, DMG_HIT_ALT) / (2 * m.a * EVOLVE_MULT),
                    dmgApply(t, 0.5 * s.stats.specialAttack, s, null, DMG_HIT_SHOT) / (0.5 * m.s), dmgApply(t, 2 * s.stats.specialAttack, s, null, DMG_HIT_SPECIAL) / (2 * m.s)]; }
            return out; })()`);
        for (const id in r) r[id].forEach((x, i) => near(x, 1, id + ' ' + ['main', 'alt', 'shot', 'special'][i] + ': the class average kept, lean and all', 1e-9));
    });

    group('THE ROWS AND THE TRIANGLE (docs/COMBAT.md §7.3, §7.6, §7.8)');
    check('the physical part meets the race\'s row by its type; the elemental part the row\'s Elemental', () => {
        const r = J(`(function(){ const s = __src(), k = dmgApply(__tgt(), 10, s, null, DMG_HIT_MAIN), base = { phys: 0, elem: 0 };
            const kk = 10 / 20 * dmgNorm(s, 'atk', 0.5); base.phys = kk * 0.5 * 20; base.elem = kk * 0.5 * 10;
            return { base, beetle: dmgApply(__tgt({ speciesName: 'beetle' }), 10, s, null, DMG_HIT_MAIN), scorpion: dmgApply(__tgt({ speciesName: 'scorpion' }), 10, s, null, DMG_HIT_MAIN) }; })()`);
        near(r.beetle, r.base.phys * 1.3 + r.base.elem, 'QUILLSTONE\'s Piercing on a beetle (weak to Piercing)', 1e-9);
        near(r.scorpion, r.base.phys * 0.7 + r.base.elem * 1.3, 'on a scorpion (resists Piercing, weak to Elemental)', 1e-9);
    });
    check('the element triangle acts on the elemental part only (fire on flux: that part ×1.3)', () => {
        const r = J(`(function(){ const s = __src(), kk = 10 / 20 * dmgNorm(s, 'atk', 0.5); return { got: dmgApply(__tgt({ element: 'flux' }), 10, s, 'fire', DMG_HIT_MAIN), want: kk * 0.5 * 20 + kk * 0.5 * 10 * 1.3 }; })()`);
        near(r.got, r.want, 'fire on flux', 1e-9);
    });
    check('ice on core: the elemental part does nothing, the physical part lands', () => {
        const r = J(`(function(){ const s = __src({ element: 'ice', evolved: 'maw' }), kk = 10 / 20 * dmgNorm(s, 'atk', 0.5); return { got: dmgApply(__tgt({ element: 'core' }), 10, s, 'ice', DMG_HIT_MAIN), want: kk * 0.5 * 20 }; })()`);
        near(r.got, r.want, 'only the physical part', 1e-9);
        ok(r.got > 0, 'the hit lands');
    });
    check('an Elemental attack\'s physical quarter has no type: no row moves it', () => {
        const r = J(`(function(){ const s = __src({ role: 'sniper', element: 'electric', evolved: 'thunderhead', stats: { attack: 10, specialAttack: 15 } }), k = 10 / 15 * dmgNorm(s, 'sp', 0.75);
            return { got: dmgApply(__tgt({ speciesName: 'spider' }), 10, s, 'electric', DMG_HIT_SHOT), want: k * 0.25 * 10 + k * 0.75 * 15 * 0.7 }; })()`);
        near(r.got, r.want, 'a spider: only the Elemental part is resisted', 1e-9);
    });
    check('a follower is hit by its subclass\'s row (QUILLSTONE, spine-legged, resists Slashing); an egg by none', () => {
        const r = J(`(function(){ const ant = { speciesName: 'ant' }; return { quill: dmgApply({ isFollower: true, evolved: 'quillstone', role: 'brawler' }, 10, ant, null, DMG_HIT_ENEMY.slashing), egg: dmgApply({ isFollower: true, role: 'brawler' }, 10, ant, null, DMG_HIT_ENEMY.slashing) }; })()`);
        near(r.quill, 7, 'resisted', 1e-9); near(r.egg, 10, 'an egg has no row', 1e-9);
    });

    group('THE OTHERS (docs/COMBAT.md §7.8)');
    check('an enemy with an element splits its hit half and half; one without is all physical', () => {
        const r = J(`(function(){ const tgt = { isFollower: true, evolved: 'quillstone', role: 'brawler', element: 'fire' };
            return { plain: dmgApply(tgt, 10, { speciesName: 'ant' }, null, DMG_HIT_ENEMY.slashing), toxic: dmgApply(tgt, 10, { speciesName: 'ant', element: 'toxic' }, null, DMG_HIT_ENEMY.slashing) }; })()`);
        near(r.plain, 7, 'all Slashing, resisted', 1e-9);
        near(r.toxic, 5 * 0.7 + 5 * 1.3, 'half Slashing (resisted), half toxic (toxic beats fire)', 1e-9);
    });
    check('a creature\'s bite is its race\'s type; a clone\'s is Piercing; a special has its own', () => {
        ok(J(`dmgBiteHit({ speciesName: 'beetle' }).type`) === 'crushing', 'a beetle bites Crushing');
        ok(J(`dmgBiteHit({ speciesName: 'mantis', isClone: true }).type`) === 'piercing', 'a clone bites Piercing');
        ok(J(`dmgAbilityHit({ speciesName: 'beetle', abilityDef: { name: 'CARAPACE SLAM' } }).type`) === 'earthquake', 'CARAPACE SLAM');
        ok(J(`dmgAbilityHit({ speciesName: 'ant', abilityDef: { name: 'MANDIBLE FRENZY' } }).type`) === 'slashing', 'MANDIBLE FRENZY');
    });
    check('the player\'s hits are all of their type: a gun\'s Projectile on a moth ×1.3; the arc all Elemental (electric on a core scorpion ×1.3 × 1.3)', () => {
        const r = J(`(function(){ const me = { isPlayer: true, team: 'green' };
            return { gun: dmgApply({ speciesName: 'moth' }, 10, me, null, DMG_HIT_GUN), arc: dmgApply({ speciesName: 'scorpion', element: 'core' }, 10, me, 'electric', DMG_HIT_ARC), lash: dmgApply({ speciesName: 'mantis' }, 10, me, null, DMG_HIT_LASH), punch: dmgApply({ speciesName: 'ant' }, 10, me, null, DMG_HIT_PUNCH) }; })()`);
        near(r.gun, 13, 'gun on a moth', 1e-9); near(r.arc, 16.9, 'arc', 1e-9); near(r.lash, 13, 'lash on a mantis', 1e-9); near(r.punch, 13, 'punch on an ant', 1e-9);
    });
    check('a player\'s weapon with an element still sets the triangle on the whole hit, as before', () => {
        near(J(`dmgApply({ speciesName: 'ant', element: 'flux' }, 10, { isPlayer: true, element: 'fire' }, null, DMG_HIT_GUN)`), 13, 'fire laser on a flux ant', 1e-9);
    });

    group('THE STATS (docs/COMBAT.md §7.6, §7.7)');
    check('each form\'s lean, by the rule (Elemental species +1, spine-legged and mollusk −1, an Elemental main attack +1 more)', () => {
        const L = J(`(function(){ const o = {}; for (const k in DMG_FORM) o[k] = dmgLean({ evolved: k }); return o; })()`);
        sameJSON(L, { quillstone: -1, maw: 1, staticorb: 0, electroskink: -1, jellyram: 0, seeper: -1, mimic: 0, thunderhead: 2, voidstar: 0, embercowl: 2, rimestar: 0, hornshell: -1, rotshard: 1, coralcrab: -1, sundew: -1, shrub: 2, hammerslug: -1, gooproxy: 0, thermite: 0, blightspider: -1, hovershell: 0, igloo: 1 }, 'the leans');   // (the THORNWHIP, BLOOM's Mage: Elemental, and an Elemental SEED SHOT, build 2026-11-08j)
        ok(J(`dmgLean({})`) === 0, 'an egg has none');
    });
    check('evolving raises SP.ATK by EVOLVE_MULT too, and the lean tilts the evolved stats (THUNDERHEAD toward SP.ATK, QUILLSTONE toward ATK)', () => {
        const r = J(`(function(){ const mk = (el, type, pers, evo) => { spawnFollowerAtCrystal(el, type); const f = followers[followers.length - 1]; f.personality = pers; f.base = applyPersonality(pers); f.level = 10; f.evolved = evo ? evolutionFor(f).id : null; _applyFollowerLevel(f, true); const s = { a: f.stats.attack, s: f.stats.specialAttack, form: f.evolved }; return s; };
            return { egg: mk('electric', 'sniper', 'cunning', false), thunder: mk('electric', 'sniper', 'cunning', true), eggB: mk('fire', 'brawler', 'aggressive', false), quill: mk('fire', 'brawler', 'aggressive', true) }; })()`);
        ok(r.thunder.form === 'thunderhead' && r.quill.form === 'quillstone', 'the forms');
        near(r.thunder.s, Math.round(Math.round(r.egg.s * 1.25) * 1.2), 'THUNDERHEAD\'s SP.ATK: ×1.25, then +20%', 0);
        near(r.thunder.a, Math.round(Math.round(r.egg.a * 1.25) * 0.8), 'THUNDERHEAD\'s ATK: ×1.25, then −20%', 0);
        near(r.quill.a, Math.round(Math.round(r.eggB.a * 1.25) * 1.1), 'QUILLSTONE\'s ATK: ×1.25, then +10%', 0);
        near(r.quill.s, Math.round(Math.round(r.eggB.s * 1.25) * 0.9), 'QUILLSTONE\'s SP.ATK: ×1.25, then −10%', 0);
    });

    group('THE WORDS, AND WHAT KEEPS THE OLD RULE');
    check('a word for each part that met a weakness or a resistance, beside the creature (the owner, 2026-11-02); ice on core says IMMUNE; one set every 12 frames', () => {
        const r = J(`(function(){ __noWords(); frame = 1000; const s = __src(); const t = __tgt({ speciesName: 'scorpion', element: 'toxic' });
            dmgApply(t, 10, s, 'fire', DMG_HIT_MAIN); const first = floatingTexts.map(x => x.text), place = floatingTexts.map(x => [x.dx, x.dy, x.text.length]);
            dmgApply(t, 10, s, 'fire', DMG_HIT_MAIN); const again = floatingTexts.length;
            __noWords(); frame = 2000; dmgApply(__tgt({ element: 'core' }), 10, __src({ element: 'ice', evolved: 'maw' }), 'ice', DMG_HIT_MAIN);
            return { first, place, again, ice: floatingTexts.map(x => x.text) }; })()`);
        sameJSON(r.first, ['PIERCING RESIST', 'FIRE RESIST'], 'QUILLSTONE on a toxic scorpion: Piercing resisted; fire on toxic ×0.7 × Elemental weak ×1.3 = 0.91');
        // beside it: to its right, each word's left edge (its centre less half its width, about 3.3 px a letter) past the creature's side; the elemental part's word under the physical part's
        ok(r.place.every(p => p[0] - p[2] * 3.3 >= 24), 'a word reaches over the creature: ' + JSON.stringify(r.place));
        ok(r.place[1][1] > r.place[0][1], 'the elemental part\'s word is not under the physical part\'s: ' + JSON.stringify(r.place));
        ok(r.again === 2, 'no second set within 12 frames');
        sameJSON(r.ice, ['ICE IMMUNE'], 'ice on core');
    });
    check('a hit that says nothing keeps the triangle on the whole hit (a burn\'s tick); a set amount and a reflected hit are never split', () => {
        const r = J(`(function(){ __noWords(); const t = __tgt({ health: 1000, maxHealth: 1000, element: 'flux', team: 'red', speciesName: 'scorpion' });
            const h0 = t.health; applyDamage(t, 10, null, 'fire'); const tick = h0 - t.health;
            const h1 = t.health; applyDamage(t, 10, null, null, false, true, DMG_HIT_MAIN); const fixed = h1 - t.health;   // (as the Kinetic Launcher's set amount: no source, js/techabilities.js)
            return { tick, fixed }; })()`);
        ok(r.tick > 10, 'the tick still meets the triangle (fire on flux): ' + r.tick);
        near(r.fixed, 10, 'a set amount is left as it is', 1e-9);
    });

    console.log(failures ? `\n${failures} failing` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
