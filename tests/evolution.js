// EVOLUTION (js/evolution.js) — the fire brawler molts into the QUILLSTONE (once the Bunker Bloom),
// the electric mage into the THUNDERHEAD (once the Reaver), and so on through the forms.
//
// THE REPORTED CASE: "Make the Bunker Bloom an evolution of the fire brawler
// and the Reaver an evolution of the electric sniper." Asked: automatically at
// a level; a stat boost and a signature move.
// The page boots the facility (js/init.js); its tutorial director would level every follower to TUT.followerLevel, which is switched off here (the levels are the fixture's).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const sb = makeBrowserSandbox({});
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) {}
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(`gameState.running = true; facilityBlackoutSet(false); unlockedElements = new Set(ELEMENTS.map(e => e.id)); TUT.followerLevel = 0;`);

    // A follower of this element and role, one XP short of `lv`.
    const mk = (el, role, lv) => run(`(function(){
        spawnFollowerAtCrystal('${el}'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = '${role}';
        f.level = ${lv} - 1; f.xp = xpForLevel(${lv}) - 1; _applyFollowerLevel(f, true); globalThis.__f = f; return followers.length - 1; })()`);
    const lvlUp = `gainXp(__f, 5);`;

    console.log('\nWHO EVOLVES, AND WHEN');
    check('THE ASK: a FIRE BRAWLER reaching level 20 becomes the QUILLSTONE (design No. 354, which replaced the Bunker Bloom), there and then', () => {
        mk('fire', 'brawler', 20);
        const r = run(`(function(){ const before = !!__f.evolved; ${lvlUp} return { before, evo: __f.evolved, lv: __f.level, molt: __f._moltAt === frame, tag: unitTypeLabel(__f) }; })()`);
        ok(!r.before, 'evolved before level 20');
        same(r.evo, 'quillstone', 'its form'); same(r.lv, 20, 'level'); ok(r.molt, 'no molt started');
        same(r.tag, 'QUILLSTONE', 'its tag'); ok(run('EVOLUTIONS.bloom.legacy === true'), 'the Bunker Bloom is no longer handed out');
    });
    check('THE ASK: an ELECTRIC SNIPER reaching its level becomes the THUNDERHEAD (design No. 541, which replaced the Reaver)', () => {
        mk('electric', 'sniper', 20); run(lvlUp);
        same(run('__f.evolved'), 'thunderhead', 'its form'); same(run('unitTypeLabel(__f)'), 'THUNDERHEAD', 'its tag'); ok(run('EVOLUTIONS.reaver.legacy === true'), 'the Reaver is no longer handed out');
    });
    check('THE ASK: a FLUX SNIPER (the void mage) reaching level 20 becomes the VOIDSTAR (design No. 637, which replaced the Serpent)', () => {
        mk('flux', 'sniper', 20); run(lvlUp);
        const r = run('({ evo: __f.evolved, tag: unitTypeLabel(__f) })');
        same(r.evo, 'voidstar', 'its form'); same(r.tag, 'VOIDSTAR', 'its tag'); ok(run('EVOLUTIONS.serpent.legacy === true'), 'the Serpent is no longer handed out');
        mk('flux', 'brawler', 20); run(lvlUp); same(run('__f.evolved'), 'mimic', 'a flux brawler is the Rift Mimic');
        same(run('unitTypeLabel(__f)'), 'RIFT MIMIC', 'its tag'); same(run('__f.role'), 'brawler', 'its role');
        mk('flux', 'hybrid', 20); run(lvlUp); same(run('__f.evolved'), 'mimic', 'a hybrid fights as a brawler');
        mk('flux', 'camper', 20); run(lvlUp); same(run('__f.evolved'), 'gooproxy', 'a flux technician is the Goo Proxy');
    });
    check('THE ASK ("the old core brawler is going to be switched to the technician class"; "Swap it"): a CORE TECHNICIAN becomes the HAMMER SLUG (design No. 467); a core brawler is the Jelly Ram now; an ELECTRIC BRAWLER becomes the STATIC ORB', () => {
        mk('core', 'camper', 20); run(lvlUp); same(run('__f.evolved'), 'hammerslug', 'core technician'); same(run('unitTypeLabel(__f)'), 'HAMMER SLUG', 'its tag'); same(run('__f.role'), 'camper', 'its role'); ok(run('EVOLUTIONS.warden.legacy === true'), 'the Aegis Warden is handed out again');
        mk('core', 'brawler', 20); run(lvlUp); same(run('__f.evolved'), 'jellyram', 'a core brawler (its new form, the Jelly Ram)');
        mk('electric', 'brawler', 20); run(lvlUp); same(run('__f.evolved'), 'staticorb', 'electric brawler');
        same(run('unitTypeLabel(__f)'), 'STATIC ORB', 'its tag'); ok(run('EVOLUTIONS.prism.legacy === true'), 'the Prism Hood design went to the fire mage'); ok(run('EVOLUTIONS.voltring.legacy === true'), 'the Volt Ring placeholder is no longer handed out'); ok(run('EVOLUTIONS.manta.legacy === true'), 'the Storm Manta is no longer handed out');
        mk('electric', 'sniper', 20); run(lvlUp); same(run('__f.evolved'), 'thunderhead', 'the electric sniper is the Thunderhead');
    });
    check('THE ASK: a FIRE SNIPER becomes the CINDER HALO (design No. 90, the ring drone); a fire brawler is still the Bunker Bloom', () => {
        mk('fire', 'sniper', 20); run(lvlUp);
        const r = run('({ evo: __f.evolved, tag: unitTypeLabel(__f), role: __f.role })');
        same(r.evo, 'embercowl', 'its form'); same(r.tag, 'EMBER HOOD', 'its tag'); ok(run('EVOLUTIONS.halo.legacy === true'), 'the Cinder Halo design went to the electric brawler'); same(r.role, 'sniper', 'its role');
        mk('fire', 'brawler', 20); run(lvlUp); same(run('__f.evolved'), 'quillstone', 'the fire brawler');
    });
    check('THE ASK: a TOXIC SNIPER becomes the ROTSHARD (design No. 101, the crystal eaten by its pool); a toxic BRAWLER the SEEPER (No. 578, which replaced the Caldera); a toxic technician the BLIGHT SPIDER', () => {
        mk('toxic', 'sniper', 20); run(lvlUp);
        const r = run('({ evo: __f.evolved, tag: unitTypeLabel(__f), role: __f.role })');
        same(r.evo, 'rotshard', 'its form'); same(r.tag, 'ROTSHARD', 'its tag'); same(r.role, 'sniper', 'its role');
        mk('toxic', 'brawler', 20); run(lvlUp); same(run('__f.evolved'), 'seeper', 'a toxic brawler is the Seeper'); same(run('unitTypeLabel(__f)'), 'SEEPER', 'its tag'); ok(run('EVOLUTIONS.caldera.legacy === true'), 'the Caldera is no longer handed out');
        mk('toxic', 'camper', 20); run(lvlUp); same(run('__f.evolved'), 'blightspider', 'a toxic technician is the Blight Spider');
    });
    check('THE ASK: a CORE MAGE (the role id is still "sniper") becomes the HORNSHELL (design No. 220, which replaced the Petal Aegis); a core technician is the Hammer Slug, a core brawler the Jelly Ram', () => {
        mk('core', 'sniper', 20); run(lvlUp);
        const r = run('({ evo: __f.evolved, tag: unitTypeLabel(__f), role: __f.role })');
        same(r.evo, 'hornshell', 'its form'); same(r.tag, 'HORNSHELL', 'its tag'); same(r.role, 'sniper', 'its role id');
        ok(run('EVOLUTIONS.petal.legacy === true'), 'the Petal Aegis is no longer handed out'); same(run('evolutionFor({ isFollower: true, element: "core", role: "sniper" }).id'), 'hornshell', 'evolutionFor');
        mk('core', 'camper', 20); run(lvlUp); same(run('__f.evolved'), 'hammerslug', 'the core technician');
        mk('core', 'brawler', 20); run(lvlUp); same(run('__f.evolved'), 'jellyram', 'a core brawler is the Jelly Ram');
    });
    check('THE ASK: the ranged role is a MAGE and the post-holding role a TECHNICIAN on screen (their ids stay "sniper" and "camper")', () => {
        same(run('roleLabel("sniper")'), 'MAGE', 'sniper'); same(run('roleLabel("brawler")'), 'BRAWLER', 'brawler'); same(run('roleLabel("camper")'), 'TECHNICIAN', 'camper'); same(run('roleLabel("hybrid")'), 'HYBRID', 'hybrid'); same(run('roleLabel(null)'), '', 'none');
        mk('flux', 'sniper', 5); same(run('unitTypeLabel(__f)'), 'FLUX MAGE', 'the tag over a unit');
        ok(!/Snipers/.test(fs.readFileSync(path.join(ROOT, 'js/clone.js'), 'utf8')), 'the colony status still says Snipers');
        const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        ok(!/<strong>Sniper<\/strong>/.test(HTML) && /<strong>Mage<\/strong>/.test(HTML), 'the index still describes a Sniper');
    });
    check('THE ASK: an ICE BRAWLER becomes the FROST MAW (design No. 156) (the ice technician is the Igloo Skater, the ice mage the Rimestar)', () => {
        mk('ice', 'brawler', 20); run(lvlUp);
        const r = run('({ evo: __f.evolved, tag: unitTypeLabel(__f), role: __f.role })');
        same(r.evo, 'maw', 'its form'); same(r.tag, 'FROST MAW', 'its tag'); same(r.role, 'brawler', 'its role');
        mk('ice', 'hybrid', 20); run(lvlUp); same(run('__f.evolved'), 'maw', 'a hybrid fights as a brawler');
    });
    check('…every element and role has its form now; nobody evolves before level 10', () => {
        for (const el of ['fire', 'electric', 'flux', 'core', 'toxic', 'ice']) for (const role of ['brawler', 'sniper', 'camper']) ok(run(`!!evolutionFor({ isFollower: true, element: '${el}', role: '${role}' })`), 'no form for a ' + el + ' ' + role);
        mk('fire', 'brawler', 9); run(lvlUp); same(run('__f.evolved || null'), null, 'a fire brawler at 9');
        mk('fire', 'brawler', 10); run(lvlUp); same(run('__f.evolved'), 'quillstone', 'a fire brawler at 10');
        same(run('EVOLVE_LEVEL'), 10, 'THE ASK: they evolve at level 10');
    });
    check('THE ASK ("add the new technician forms now"): a FLUX TECHNICIAN becomes the GOO PROXY, a FIRE one the THERMITE BURROWER, an ICE one the IGLOO SKATER; each stays a technician', () => {
        for (const [el, id, name] of [['flux', 'gooproxy', 'GOO PROXY'], ['fire', 'thermite', 'THERMITE BURROWER'], ['ice', 'igloo', 'IGLOO SKATER'], ['toxic', 'blightspider', 'BLIGHT SPIDER'], ['electric', 'hovershell', 'HOVER SHELL']]) {
            mk(el, 'camper', 20); run(lvlUp);
            const r = run('({ evo: __f.evolved, tag: unitTypeLabel(__f), role: __f.role, molt: __f._moltAt === frame })');
            same(r.evo, id, el + ' technician'); same(r.tag, name, el + ' tag'); same(r.role, 'camper', el + ' role'); ok(r.molt, el + ': no molt');
            same(run(`evolutionFor({ isFollower: true, element: '${el}', role: 'camper' }).id`), id, el + ' evolutionFor');
        }
        same(run('Object.values(EVOLUTIONS).filter(d => !d.legacy && d.role === "camper").map(d => d.id).sort().join()'), 'blightspider,gooproxy,hammerslug,hovershell,igloo,thermite', 'the technicians\' forms');
    });
    check('THE ASK ("they help traverse the battlefield and provide exploration tools [...] I will put them in later"): the new technicians\' forms have NO signature move, and run without one', () => {
        for (const id of ['gooproxy', 'thermite', 'igloo', 'blightspider', 'hovershell', 'rimestar']) { same(run('EVOLUTIONS.' + id + '.move || null'), null, id + ' has a move'); same(run('EVOLUTIONS.' + id + '.moves || null'), null, id + ' has moves'); same(run(`evoMoveOf({ evolved: '${id}' })`), null, id + ' fires a move'); }
        const r = run(`(function(){ followers.length = 0; spawnFollowerAtCrystal('flux'); const f = followers[0]; f.returningToCrystal = false; f.role = 'camper'; f.evolved = 'gooproxy'; f._moltAt = -1e9; f._sigCd = 0;
            const t0 = floatingTexts.length, fx0 = elementEffects.length; for (let i = 0; i < 400; i++) evolutionTick();
            return { role: f.role, texts: floatingTexts.length - t0, fx: elementEffects.length - fx0, sig: f._sigAt === undefined }; })()`);
        same(r.role, 'camper', 'its role'); same(r.texts, 0, 'a move was announced'); same(r.fx, 0, 'a move went off'); ok(r.sig, 'a move was marked as fired');
    });
    check('THE ASK ("do the Jelly Ram and Ice Mage now"): a CORE BRAWLER becomes the JELLY RAM (design No. 860), with no move (its AEGIS BURST went with the followers\' shield); an ICE MAGE becomes the RIMESTAR (No. 861), with no move, and is still an Ice Mage to the specimens', () => {
        mk('core', 'brawler', 20); run(lvlUp);
        let r = run('({ evo: __f.evolved, tag: unitTypeLabel(__f), role: __f.role, move: evoMoveOf(__f) && evoMoveOf(__f).id })');
        same(r.evo, 'jellyram', 'core brawler'); same(r.tag, 'JELLY RAM', 'its tag'); same(r.role, 'brawler', 'its role'); same(r.move, null, 'its move');
        mk('ice', 'sniper', 20); run(lvlUp);
        r = run('({ evo: __f.evolved, tag: unitTypeLabel(__f), role: __f.role, move: evoMoveOf(__f), mage: specimenIsMage(__f) })');
        same(r.evo, 'rimestar', 'ice mage'); same(r.tag, 'RIMESTAR', 'its tag'); same(r.role, 'sniper', 'its role'); same(r.move, null, 'its move'); same(r.mage, true, 'an Ice Mage to the specimens');
        same(run('Object.values(EVOLUTIONS).filter(d => !d.legacy && d.role === "brawler" && d.element === "core").map(d => d.id).join()'), 'jellyram', 'the core brawler\'s forms');
    });
    check('a follower already past level 20 (an old save) evolves on the next tick', () => {
        const r = run(`(function(){ spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.role = 'brawler'; f.level = 34; f.xp = xpForLevel(34); _applyFollowerLevel(f, true);
            frame = Math.ceil((frame + 1) / 30) * 30; evolutionTick(); return f.evolved; })()`);
        same(r, 'quillstone', 'its form');
    });

    console.log('\nWHAT IT GAINS');
    check('THE ASK: health and power × EVOLVE_MULT — and they survive the next level-up', () => {
        // The control is a plain follower of the same stats that cannot evolve (every element and role has a form now, so its form is switched off for the check); the twin is a fire brawler turned Bunker Bloom.
        const r = run(`(function(){ const evoFor = evolutionFor; evolutionFor = f => f.__control ? null : evoFor(f); try { mkTwin = (ev) => { spawnFollowerAtCrystal(ev ? 'fire' : 'toxic'); const f = followers[followers.length - 1]; f.role = ev ? 'brawler' : 'camper';
                f.base = { hp: 40, attack: 12, defense: 10, specialAttack: 10, accuracy: 10, will: 20, speed: 10 }; f.level = 22; f.xp = xpForLevel(22); if (ev) f.evolved = 'bloom'; _applyFollowerLevel(f, true); return f; };
            const a = mkTwin(false), b = mkTwin(true); a.__control = true; b._moltAt = -1e9;
            const r1 = { hp: b.maxHealth / a.maxHealth, pw: b.power / a.power };
            a.xp = xpForLevel(23); b.xp = xpForLevel(23); gainXp(a, 1); gainXp(b, 1);
            return { r1, r2: { hp: b.maxHealth / a.maxHealth, pw: b.power / a.power, lv: [a.level, b.level], ctl: a.evolved || null } }; } finally { evolutionFor = evoFor; } })()`);
        const M = run('EVOLVE_MULT'); same(r.r2.ctl, null, 'the control evolved');
        ok(Math.abs(r.r1.hp - M) < 0.05 && Math.abs(r.r1.pw - M) < 0.1, 'at evolving: ' + JSON.stringify(r.r1));
        ok(Math.abs(r.r2.hp - M) < 0.05 && Math.abs(r.r2.pw - M) < 0.1 && r.r2.lv[1] === 23, 'after a level-up: ' + JSON.stringify(r.r2));
    });
    check('THE ASK: PETAL BLAZE — a ring of fire that hits and burns everything close, then waits', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator));
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.role = 'brawler'; f.evolved = 'bloom'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, 2); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const near = mkP(21), far = mkP(24);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const out = { near: 1e6 - near.health, burn: near.burning > 0, far: 1e6 - far.health, cd: f._sigCd };
            near.health = 1e6; evolutionTick(); out.again = 1e6 - near.health;
            near.dead = far.dead = true; return out; })()`);
        ok(r.near > 0 && r.burn, 'the close one: ' + JSON.stringify(r));
        same(r.far, 0, 'damage 4 tiles away');
        ok(r.cd > 300 && r.again === 0, 'it fired again at once: ' + JSON.stringify(r));
    });
    // QUILL BURST, rebuilt (ASKED, the Notion design archive: a projectile with a 75% hit chance that improves up close; the numbers chosen with the user, 2026-10-30)
    const QB = `globalThis.__qb = (rolls, foes) => { actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0; floatingTexts.length = 0; elementEffects.length = 0;
        spawnFollowerAtCrystal('fire'); const f = followers[0]; f.role = 'brawler'; f.evolved = 'quillstone'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2; f.stance = 'hold';
        const S = SPECIES.ant, ps = foes.map(([x, y]) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 20 + x, 2 + y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; });
        const twin = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 30, 30); twin.team = 'red'; twin.health = twin.maxHealth = 1e6; twin.update = () => {};
        applyDamage(twin, f.power * QUILL_MULT, f, 'fire'); const base = 1e6 - twin.health; floatingTexts.length = 0; elementEffects.length = 0;   // (the plain hit the quills are measured against, made before the rolls are set)
        const keep = Math.random, seq = rolls.slice(); Math.random = () => seq.length ? seq.shift() : 0.5;
        try { frame++; f._sigCd = 1; evolutionTick();
              return { dmg: ps.map(p => (1e6 - p.health) / base), burn: ps.map(p => p.burning > 0), cd: f._sigCd, texts: floatingTexts.map(t => t.text).join('|'), fx: elementEffects.map(e => e.type).join('|'), q: elementEffects.find(e => e.type === 'quills'), foes: ps.length }; }
        finally { Math.random = keep; for (const p of ps) p.dead = true; } };`;
    check('QUILL BURST (rebuilt): the chance of a hit is 75% at its 4 tiles of reach, rising in a straight line to 100% within 1 tile, and no more than 100% or less than 75% anywhere', () => {
        run(QB); const r = run(`[QUILL_RANGE, QUILL_SURE, QUILL_CHANCE, QUILL_EVERY, QUILL_MULT, QUILL_BONUS, QUILL_SPLASH, quillChance(4), quillChance(6), quillChance(2.5), quillChance(1), quillChance(0.4), quillChance(0)]`);
        same(r.slice(0, 7).join(), '4,1,0.75,240,2,0.25,0.8', 'the numbers (reach 4 tiles, a sure hit within 1, 75% at the reach, every 4 s, 2.0x power, +25% on a hit, a splash of 0.8 tile)');
        same(r[7], 0.75, 'at the reach'); same(r[8], 0.75, 'beyond it'); ok(Math.abs(r[9] - 0.875) < 1e-9, 'half way: ' + r[9]); same(r[10], 1, 'within a tile'); same(r[11], 1, 'point blank'); same(r[12], 1, 'on top of it');
    });
    check('QUILL BURST (rebuilt): a hit does 2.0x its power and 25% more (2.5x) to the target and burns nobody; it shows QUILL BURST and an impact; the quills fly to the target; it then waits 4 seconds', () => {
        run(QB); const r = run(`__qb([0], [[3, 0]])`);
        ok(Math.abs(r.dmg[0] - 1.25) < 0.01, 'the hit does ' + r.dmg[0] + ' of the base damage, not 1.25'); same(r.burn[0], false, 'it burned'); same(r.cd, 240, 'its cooldown'); ok(/QUILL BURST/.test(r.texts) && !/MISS/.test(r.texts), 'it said: ' + r.texts); same(r.fx, 'quills|impact', 'its effects');
        ok(Math.abs(r.q.tx - 23) < 1e-9 && Math.abs(r.q.ty - 2) < 1e-9, 'the quills fly to the target: ' + JSON.stringify(r.q));
    });
    check('QUILL BURST (rebuilt): a miss does nothing to anyone, says MISS over the target, the quills fly on past it, and it still waits its 4 seconds', () => {
        run(QB); const r = run(`__qb([0.999], [[3, 0]])`);
        same(r.dmg[0], 0, 'a miss hurt'); same(r.burn[0], false, 'a miss burned'); same(r.cd, 240, 'a miss skips its cooldown'); ok(/QUILL BURST/.test(r.texts) && /MISS/.test(r.texts), 'it said: ' + r.texts); same(r.fx, 'quills', 'its effects (no impact on a miss)');
        ok(r.q.tx > 23.5, 'the quills stop at the target instead of flying past: ' + JSON.stringify(r.q));
    });
    check('QUILL BURST (rebuilt): the roll is against the chance at the target\'s distance: at the reach 0.74 hits and 0.76 misses; within a tile nothing misses', () => {
        run(QB); same(run(`__qb([0.74], [[4, 0]])`).dmg[0] > 0, true, '0.74 at 4 tiles'); same(run(`__qb([0.76], [[4, 0]])`).dmg[0], 0, '0.76 at 4 tiles');
        same(run(`__qb([0.999], [[0.8, 0]])`).dmg[0] > 0, true, '0.999 at 0.8 tile (a sure hit)'); same(run(`__qb([0.874], [[2.5, 0]])`).dmg[0] > 0, true, '0.874 at 2.5 tiles'); same(run(`__qb([0.876], [[2.5, 0]])`).dmg[0], 0, '0.876 at 2.5 tiles');
    });
    check('QUILL BURST (rebuilt): it fires at the nearest enemy within 4 tiles and at nobody beyond (no cooldown spent); the splash is 0.8 tile round the target: a neighbour inside it takes the same hit, one outside it, and a farther enemy, take nothing', () => {
        run(QB); const none = run(`__qb([0], [[4.4, 0]])`); same(none.dmg[0], 0, 'an enemy beyond the reach was hit'); ok(none.cd <= 0, 'it spent its cooldown on nothing: ' + none.cd); same(none.texts, '', 'it spoke with nobody to shoot at');
        const r = run(`__qb([0], [[2, 0], [2.6, 0.2], [3, 1.4], [3.9, 0]])`);
        ok(Math.abs(r.dmg[0] - 1.25) < 0.01, 'the nearest: ' + r.dmg[0]); ok(Math.abs(r.dmg[1] - 1.25) < 0.01, 'a neighbour inside the splash took ' + r.dmg[1]); same(r.dmg[2], 0, 'an enemy outside the splash took damage'); same(r.dmg[3], 0, 'a farther enemy took damage');
    });
    check('QUILL BURST (rebuilt): the Bunker Bloom keeps its ring of fire (PETAL BLAZE), the Quillstone\'s move is its own function, INFO says what it does (reach, every, hit chance, damage, effect), and the quills are drawn', () => {
        same(run(`MOVES.petal_blaze.fn.toString().indexOf('petalBlaze(') >= 0 && MOVES.quill_burst.fn.toString().indexOf('quillBurst(') >= 0 && MOVES.quill_burst.fn.toString().indexOf('petalBlaze') < 0`), true, 'the two moves');
        const rows = JSON.parse(run(`JSON.stringify(MOVE_INFO['QUILL BURST']())`)), by = {}; rows.forEach(x => { by[x[0]] = x[1]; });
        same(Object.keys(by).join(), 'REACH,EVERY,HIT CHANCE,DAMAGE,EFFECT', 'its INFO rows'); same(by.REACH, '4 tiles', 'reach'); same(by.EVERY, '4 s', 'every'); ok(/75%.*4 tiles.*100%.*1 tile/.test(by['HIT CHANCE']), 'hit chance: ' + by['HIT CHANCE']); ok(/2×.*\+25%/.test(by.DAMAGE), 'damage: ' + by.DAMAGE); ok(/miss/.test(by.EFFECT), 'effect: ' + by.EFFECT);
        same(run(`(function(){ elementEffects.length = 0; elementEffects.push({ type: 'quills', x: player.x, y: player.y, tx: player.x + 3, ty: player.y, life: 7, maxLife: 14 }); try { drawElementEffects(); return 'drawn'; } catch (e) { return e.message; } finally { elementEffects.length = 0; } })()`), 'drawn', 'drawing the quills');
    });
    check('THE ASK: ARC VOLLEY — a charged arc into the nearest enemy in range, jumping to the ones beside it', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator));
            spawnFollowerAtCrystal('electric'); const f = followers[followers.length - 1]; f.role = 'sniper'; f.evolved = 'thunderhead'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const a = mkP(24, 2), b = mkP(25.5, 2.5), c = mkP(26.8, 1.5), lone = mkP(32, 2), tooFar = mkP(20, 40);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { a: d(a), b: d(b), c: d(c), lone: d(lone), arcs: (f._arcPts || []).length };
            [a, b, c, lone, tooFar].forEach(p => p.dead = true); return out; })()`);
        ok(r.a > r.b && r.b > 0 && r.c > 0, 'the arc and its jumps: ' + JSON.stringify(r));
        same(r.lone, 0, 'damage to one out of reach of any jump');
        same(r.arcs, 3, 'arcs drawn');
    });

    check('the legacy REAVER still fires ARC VOLLEY for a follower already evolved into it', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator));
            spawnFollowerAtCrystal('electric'); const f = followers[followers.length - 1]; f.role = 'sniper'; f.evolved = 'reaver'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const a = mkP(24, 2), b = mkP(25.5, 2.5), c = mkP(26.8, 1.5), lone = mkP(32, 2), tooFar = mkP(20, 40);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { a: d(a), b: d(b), c: d(c), lone: d(lone), arcs: (f._arcPts || []).length };
            [a, b, c, lone, tooFar].forEach(p => p.dead = true); return out; })()`);
        ok(r.a > r.b && r.b > 0 && r.c > 0, 'the arc and its jumps: ' + JSON.stringify(r));
        same(r.lone, 0, 'damage to one out of reach of any jump');
        same(r.arcs, 3, 'arcs drawn');
    });

    check('THE ASK: HEXFIRE — the cinder halo fires six rounds at once, shared out among the nearest enemies, each setting its target burning', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('fire'); const f = followers[0]; f.role = 'sniper'; f.evolved = 'halo'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const fire = () => { frame++; f._sigCd = 1; evolutionTick(); };
            const a = mkP(24, 2), b = mkP(25, 3), c = mkP(26, 1), far = mkP(40, 2);
            fire();
            const d = p => 1e6 - p.health, shot = d(a) + d(b) + d(c), per = f.power * HALO_MULT;
            const out = { rounds: (f._arcPts || []).length, shot, per, a: d(a), b: d(b), c: d(c), far: d(far), burn: a.burning > 0 && b.burning > 0 && c.burning > 0, fan: f._arcFan, cd: f._sigCd };
            [a, b, c, far].forEach(p => p.dead = true);
            // Alone, all six go into the one.
            const solo = mkP(24, 2); fire(); out.solo = d(solo); solo.dead = true; return out; })()`);
        same(r.rounds, 6, 'six rounds');
        ok(Math.abs(r.shot - 6 * r.per) < 1e-6 * r.shot + 1e-3, 'six rounds of damage in all: ' + JSON.stringify(r));
        ok(r.a > 0 && r.b > 0 && r.c > 0 && r.burn, 'shared out among the three, burning: ' + JSON.stringify(r));
        same(r.far, 0, 'damage 20 tiles away'); ok(r.fan, 'the rounds do not fan from the ring'); ok(r.cd > 300, 'it did not wait');
        ok(Math.abs(r.solo - 6 * r.per) < 1e-3, 'alone, all six go into the one: ' + JSON.stringify(r));
    });

    check('the EMBER HOOD (the fire mage) fires HEXFIRE: six rounds at once', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('fire'); const f = followers[0]; f.role = 'sniper'; f.evolved = 'embercowl'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const fire = () => { frame++; f._sigCd = 1; evolutionTick(); };
            const a = mkP(24, 2), b = mkP(25, 3), c = mkP(26, 1), far = mkP(40, 2);
            fire();
            const d = p => 1e6 - p.health, shot = d(a) + d(b) + d(c), per = f.power * HALO_MULT;
            const out = { rounds: (f._arcPts || []).length, shot, per, a: d(a), b: d(b), c: d(c), far: d(far), burn: a.burning > 0 && b.burning > 0 && c.burning > 0, fan: f._arcFan, cd: f._sigCd };
            [a, b, c, far].forEach(p => p.dead = true);
            // Alone, all six go into the one.
            const solo = mkP(24, 2); fire(); out.solo = d(solo); solo.dead = true; return out; })()`);
        same(r.rounds, 6, 'six rounds');
        ok(Math.abs(r.shot - 6 * r.per) < 1e-6 * r.shot + 1e-3, 'six rounds of damage in all: ' + JSON.stringify(r));
        ok(r.a > 0 && r.b > 0 && r.c > 0 && r.burn, 'shared out among the three, burning: ' + JSON.stringify(r));
        same(r.far, 0, 'damage 20 tiles away'); ok(r.fan, 'the rounds do not fan from the ring'); ok(r.cd > 300, 'it did not wait');
        ok(Math.abs(r.solo - 6 * r.per) < 1e-3, 'alone, all six go into the one: ' + JSON.stringify(r));
    });

    check('THE ASK: CORRODE SHOT — one long shot that eats the nearest enemy\'s armour, with a weaker corrosion splashed over its neighbours', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('toxic'); const f = followers[0]; f.role = 'sniper'; f.evolved = 'rotshard'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const a = mkP(24, 2), b = mkP(25, 2.8), far = mkP(40, 2), apart = mkP(24, 7);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { a: d(a), b: d(b), far: d(far), apart: d(apart), sa: [a.defenseShredded, a.defenseShredFactor], sb: [b.defenseShredded, b.defenseShredFactor], sfar: far.defenseShredded || 0, sapart: apart.defenseShredded || 0, cd: f._sigCd };
            [a, b, far, apart].forEach(p => p.dead = true); return out; })()`);
        ok(r.a > 0 && r.b === 0, 'one shot, into the nearest: ' + JSON.stringify(r));
        ok(r.sa[0] >= run('ROT_SHRED_FRAMES') && r.sa[1] <= run('ROT_SHRED'), 'the target\'s armour: ' + JSON.stringify(r));
        ok(r.sb[0] > 0 && r.sb[0] < r.sa[0] && r.sb[1] > r.sa[1] && r.sb[1] < 1, 'the neighbour\'s weaker corrosion: ' + JSON.stringify(r));
        same(r.sfar, 0, 'corroded out of range'); same(r.sapart, 0, 'corroded beyond the splash'); ok(r.cd > 300, 'it did not wait');
    });

    check('THE ASK: GRAVITY SLAM — it flattens and slams: hits, shoves and slows everything close; a beetle is too heavy to shove', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('flux'); const f = followers[0]; f.role = 'brawler'; f.evolved = 'mimic'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const mkP = (sp, x, y) => { const S = SPECIES[sp], p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.speciesName = sp; p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const a = mkP('ant', 21.2, 2), b = mkP('ant', 20, 3.4), beetle = mkP('beetle', 18.8, 2), far = mkP('ant', 25, 2);
            const a0 = Math.hypot(a.x - f.x, a.y - f.y), beetle0 = beetle.x;
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { a: d(a), b: d(b), beetle: d(beetle), far: d(far), pushed: Math.hypot(a.x - f.x, a.y - f.y) - a0, beetleMoved: beetle.x !== beetle0, slowed: a.slowed > 0 && b.slowed > 0, sf: a.slowFactor, farSlowed: far.slowed > 0, cd: f._sigCd };
            [a, b, beetle, far].forEach(p => p.dead = true); return out; })()`);
        ok(r.a > 0 && r.b > 0 && r.beetle > 0, 'the slam hit: ' + JSON.stringify(r));
        same(r.far, 0, 'damage outside the slam'); ok(!r.farSlowed, 'slowed outside the slam');
        ok(r.pushed > 0.3 && r.slowed && r.sf === run('MIMIC_SLOW') && r.sf < 1, 'shoved and slowed: ' + JSON.stringify(r)); ok(!r.beetleMoved, 'a beetle was shoved'); ok(r.cd > 300, 'it did not wait');
    });

    check('REPORTED ("Remove the bubble shield from the followers and all relevant abilities"): nothing puts a shield on a follower now. The core forms (the Jelly Ram, the Hornshell, the Hammer Slug, the old Aegis Warden and Petal Aegis) have no move and cast nothing with an enemy and a hurt ally in reach; core has no special (a core follower\'s attacks are its physical, Shield Bash) and no ultimate; a creature\'s shield still soaks a hit', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0; const o = {};
            o.moves = ['jellyram', 'hornshell', 'hammerslug', 'warden', 'petal'].filter(id => evoMoveOf({ evolved: id }, EVOLUTIONS[id])).join();
            o.left = ['aegisBurst', 'aegisBloom'].filter(n => typeof globalThis[n] === 'function').join() + (typeof WARDEN_SHIELD !== 'undefined' || typeof PETAL_SHIELD !== 'undefined' ? ',constants' : '');
            o.special = typeof ELEMENT_ATTACKS.core.special; o.ult = typeof FOLLOWER_ULTIMATES.core; o.otherUlts = ['fire', 'electric', 'ice', 'flux', 'toxic'].filter(e => FOLLOWER_ULTIMATES[e]).length;
            const S = SPECIES.ant, mkP = (x) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, 2); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            o.cast = [];
            for (const id of ['jellyram', 'hornshell', 'hammerslug', 'warden', 'petal']) {
                followers.length = 0; actors = actors.filter(a => !(a instanceof Predator));
                spawnFollowerAtCrystal('core'); const f = followers[0]; f.role = EVOLUTIONS[id].role; f.evolved = id; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
                spawnFollowerAtCrystal('fire'); const al = followers[1]; al.returningToCrystal = false; al.x = 21; al.y = 2; al.health = Math.round(al.maxHealth * 0.3); al.shielded = false; al.shieldAmount = 0;
                const p = mkP(21.4); for (let k = 0; k < 3; k++) { frame++; f._sigCd = 1; evolutionTick(); }
                if (f._sigAt !== undefined || al.shielded || f.shielded || p.health < 1e6) o.cast.push(id);
                p.dead = true;
            }
            // a core follower's attacks, many of them, with a hurt ally beside it: Shield Bash every time, never a shield on anyone
            followers.length = 0; actors = actors.filter(a => !(a instanceof Predator));
            spawnFollowerAtCrystal('core'); const c = followers[0]; c.returningToCrystal = false; c.role = 'hybrid'; c.x = 20; c.y = 2;
            spawnFollowerAtCrystal('fire'); const al2 = followers[1]; al2.returningToCrystal = false; al2.x = 20.5; al2.y = 2.5; al2.shielded = false;
            const tgt = mkP(21); let bashes = 0;
            for (let k = 0; k < 200; k++) { c.attackCooldown = 0; c.currentWill = 100; c.invulnerable = 0; const h0 = tgt.health; followerAttack(c, tgt); if (tgt.health < h0) bashes++; if (al2.shielded || c.shielded || c.invulnerable > 0) { o.shieldedBy = k; break; } }
            o.bashes = bashes;
            // a creature's shield is the creatures' own and still works: it soaks the hit
            tgt.shielded = true; tgt.shieldAmount = 50; const h1 = tgt.health; applyDamage(tgt, 10, c, 'core'); o.soak = [tgt.health === h1, tgt.shieldAmount]; tgt.dead = true;
            return o; })()`);
        same(r.moves, '', 'core forms with a move'); same(r.left, '', 'the shield moves are still defined'); same(r.cast.join(), '', 'cast with an enemy in reach');
        same(r.special, 'undefined', 'core still has a special (Radiant Pulse)'); same(r.ult, 'undefined', 'core still has an ultimate (Shield Grant)'); same(r.otherUlts, 5, 'the other elements\' ultimates');
        same(r.shieldedBy, undefined, 'a core follower\'s attack shielded someone'); same(r.bashes, 200, 'every attack a Shield Bash that hit');
        same(r.soak.join(), 'true,40', 'a creature\'s shield did not soak the hit');
        const draw = fs.readFileSync(path.join(ROOT, 'js/draw.js'), 'utf8'), helpers = fs.readFileSync(path.join(ROOT, 'js/helpers.js'), 'utf8');
        ok(!/_drawFollowerShield|ellipse\(px, py - 32, 17, 22/.test(draw), 'the bubble is still drawn'); ok(!/_shieldHitAt/.test(draw + helpers), 'the bubble\'s hit flash is still kept');
        ok(/isFollower && typeof actor\.ultimateCharge === "number" && typeof FOLLOWER_ULTIMATES !== "undefined" && FOLLOWER_ULTIMATES\[actor\.element\]/.test(draw), 'a core follower still has an ultimate bar');
    });
    check('THE ASK: ERUPTION — the crater bursts over everything close: toxic damage and eaten armour', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('toxic'); const f = followers[0]; f.role = 'brawler'; f.evolved = 'seeper'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const a = mkP(21.2, 2), b = mkP(20, 3.5), far = mkP(24, 2);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { a: d(a), b: d(b), far: d(far), sa: [a.defenseShredded, a.defenseShredFactor], sb: [b.defenseShredded, b.defenseShredFactor], sfar: far.defenseShredded || 0, cd: f._sigCd };
            [a, b, far].forEach(p => p.dead = true);
            const lone = mkP(24, 2); frame++; f._sigCd = 1; f._sigAt = undefined; evolutionTick(); out.loneCast = f._sigAt !== undefined; lone.dead = true; return out; })()`);
        ok(r.a > 0 && r.b > 0 && r.a === r.b, 'both in the blast take the same: ' + JSON.stringify(r)); same(r.far, 0, 'damage outside the blast');
        ok(r.sa[0] >= run('CALDERA_SHRED_FRAMES') && r.sa[1] === 0.5 && r.sb[1] === 0.5, 'armour eaten (it takes double): ' + JSON.stringify(r));
        same(r.sfar, 0, 'armour eaten outside the blast'); ok(r.cd > 300, 'it did not wait'); ok(!r.loneCast, 'it erupted with nothing in reach');
    });

    check('the legacy CALDERA still erupts for a follower already evolved into it', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('toxic'); const f = followers[0]; f.role = 'brawler'; f.evolved = 'caldera'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const a = mkP(21.2, 2), b = mkP(20, 3.5), far = mkP(24, 2);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { a: d(a), b: d(b), far: d(far), sa: [a.defenseShredded, a.defenseShredFactor], sb: [b.defenseShredded, b.defenseShredFactor], sfar: far.defenseShredded || 0, cd: f._sigCd };
            [a, b, far].forEach(p => p.dead = true);
            const lone = mkP(24, 2); frame++; f._sigCd = 1; f._sigAt = undefined; evolutionTick(); out.loneCast = f._sigAt !== undefined; lone.dead = true; return out; })()`);
        ok(r.a > 0 && r.b > 0 && r.a === r.b, 'both in the blast take the same: ' + JSON.stringify(r)); same(r.far, 0, 'damage outside the blast');
        ok(r.sa[0] >= run('CALDERA_SHRED_FRAMES') && r.sa[1] === 0.5 && r.sb[1] === 0.5, 'armour eaten (it takes double): ' + JSON.stringify(r));
        same(r.sfar, 0, 'armour eaten outside the blast'); ok(r.cd > 300, 'it did not wait'); ok(!r.loneCast, 'it erupted with nothing in reach');
    });

    check('THE ASK: CHOMP — the fangs slam down on the nearest enemy: ice damage, frozen stiff; the ones beside it slowed', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('ice'); const f = followers[0]; f.role = 'brawler'; f.evolved = 'maw'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const a = mkP(21.2, 2), b = mkP(21.9, 2.8), far = mkP(24, 2), apart = mkP(21.2, 5);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { a: d(a), b: d(b), far: d(far), stunA: a.hitStun || 0, stunB: b.hitStun || 0, realA: a.stunned || 0, realB: b.stunned || 0, slowA: a.slowed > 0, slowB: a.slowed > 0 && b.slowed > 0, sf: b.slowFactor, farSlow: far.slowed > 0, apartSlow: apart.slowed > 0, cd: f._sigCd };
            [a, b, far, apart].forEach(p => p.dead = true);
            const lone = mkP(23.5, 2); frame++; f._sigCd = 1; f._sigAt = undefined; evolutionTick(); out.loneCast = f._sigAt !== undefined; lone.dead = true; return out; })()`);
        ok(r.a > 0 && r.b === 0, 'one bite, into the nearest: ' + JSON.stringify(r)); ok(r.stunA >= 60 && r.stunB === 0, 'frozen stiff (only the one bitten): ' + JSON.stringify(r)); ok(r.realA >= 60 && r.realB === 0, 'the stun is real, not a number nothing reads (only the one bitten): ' + JSON.stringify(r));
        ok(r.slowB && r.sf <= 0.6 && r.sf > 0 && !r.farSlow && !r.apartSlow, 'the ones beside it slowed: ' + JSON.stringify(r)); ok(r.cd > 250, 'it did not wait'); ok(!r.loneCast, 'it bit at something out of reach');
    });

    check('the VOIDSTAR (the void mage) fires SINGULARITY SHOT too', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator));
            spawnFollowerAtCrystal('flux'); const f = followers[followers.length - 1]; f.role = 'sniper'; f.evolved = 'voidstar'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const mkP = (sp, x, y) => { const S = SPECIES[sp], p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.speciesName = sp; p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const tgt = mkP('ant', 25, 2), mate = mkP('ant', 26.5, 2.5), beetle = mkP('beetle', 25.5, 1.2), apart = mkP('ant', 29, 2), tooFar = mkP('ant', 40, 2);
            const m0 = Math.hypot(mate.x - tgt.x, mate.y - tgt.y), b0 = Math.hypot(beetle.x - tgt.x, beetle.y - tgt.y);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { tgt: d(tgt), mate: d(mate), mateIn: m0 - Math.hypot(mate.x - tgt.x, mate.y - tgt.y), beetleIn: b0 - Math.hypot(beetle.x - tgt.x, beetle.y - tgt.y),
                slowed: mate.slowed > 0, apartMoved: apart.x !== 29, cd: f._sigCd };
            [tgt, mate, beetle, apart, tooFar].forEach(p => p.dead = true); return out; })()`);
        ok(r.tgt > 0, 'no hit on the target: ' + JSON.stringify(r));
        ok(r.mateIn > 0.5 && r.slowed, 'the one beside it was not dragged in and slowed: ' + JSON.stringify(r));
        same(r.beetleIn, 0, 'a beetle was dragged');
        ok(!r.apartMoved, 'one out of the pull\'s reach was moved');
        ok(r.cd > 300, 'it did not wait: ' + r.cd);
    });

    check('the legacy SERPENT still fires SINGULARITY SHOT for a follower already evolved into it', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator));
            spawnFollowerAtCrystal('flux'); const f = followers[followers.length - 1]; f.role = 'sniper'; f.evolved = 'serpent'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const mkP = (sp, x, y) => { const S = SPECIES[sp], p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.speciesName = sp; p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const tgt = mkP('ant', 25, 2), mate = mkP('ant', 26.5, 2.5), beetle = mkP('beetle', 25.5, 1.2), apart = mkP('ant', 29, 2), tooFar = mkP('ant', 40, 2);
            const m0 = Math.hypot(mate.x - tgt.x, mate.y - tgt.y), b0 = Math.hypot(beetle.x - tgt.x, beetle.y - tgt.y);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { tgt: d(tgt), mate: d(mate), mateIn: m0 - Math.hypot(mate.x - tgt.x, mate.y - tgt.y), beetleIn: b0 - Math.hypot(beetle.x - tgt.x, beetle.y - tgt.y),
                slowed: mate.slowed > 0, apartMoved: apart.x !== 29, cd: f._sigCd };
            [tgt, mate, beetle, apart, tooFar].forEach(p => p.dead = true); return out; })()`);
        ok(r.tgt > 0, 'no hit on the target: ' + JSON.stringify(r));
        ok(r.mateIn > 0.5 && r.slowed, 'the one beside it was not dragged in and slowed: ' + JSON.stringify(r));
        same(r.beetleIn, 0, 'a beetle was dragged');
        ok(!r.apartMoved, 'one out of the pull\'s reach was moved');
        ok(r.cd > 300, 'it did not wait: ' + r.cd);
    });

    check('the HAMMER SLUG (the core technician now): one evolved while it was the core brawler is a technician now', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('core'); const f = followers[0]; f.role = 'brawler'; f.evolved = 'hammerslug'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            frame++; evolutionTick(); return { role: f.role }; })()`);
        same(r.role, 'camper', 'a hammer slug evolved as a brawler is not a technician now');
    });
    check('THE ASK: STATIC RUSH — it dashes to the nearest enemy, hits it, shocks two more, and stuns them all', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('electric'); const f = followers[0]; f.role = 'brawler'; f.evolved = 'manta'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const a = mkP(23, 2), b = mkP(24.5, 2.4), c = mkP(25.8, 1.6), far = mkP(24, 8);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { dist: Math.hypot(a.x - f.x, a.y - f.y), a: d(a), b: d(b), c: d(c), far: d(far), stun: [a, b, c].every(p => p.hitStun >= MANTA_STUN), real: [a, b, c].every(p => p.stunned > 0), cd: f._sigCd };
            [a, b, c, far].forEach(p => p.dead = true); return out; })()`);
        ok(r.dist < 1 && r.a > r.b && r.b > 0 && r.c > 0, 'the dash and the shocks: ' + JSON.stringify(r));
        same(r.far, 0, 'damage to one out of reach'); ok(r.stun, 'not all stunned'); ok(r.real, 'not all really stunned (js/combat.js applyStun)'); ok(r.cd > 250, 'it did not wait');
    });
    check('the PRISM HOOD runs the same STATIC RUSH (dash, shock, stun) as the Storm Manta did', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('electric'); const f = followers[0]; f.role = 'brawler'; f.evolved = 'prism'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 23, 2); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p);
            frame++; f._sigCd = 1; evolutionTick(); const out = { dist: Math.hypot(p.x - f.x, p.y - f.y), dmg: 1e6 - p.health, stun: p.hitStun >= MANTA_STUN }; p.dead = true; return out; })()`);
        ok(r.dist < 1 && r.dmg > 0 && r.stun, 'the prism hood did not rush: ' + JSON.stringify(r));
    });

    check('the STATIC ORB (the electric brawler) runs STATIC RUSH: dash, shock, stun', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('electric'); const f = followers[0]; f.role = 'brawler'; f.evolved = 'staticorb'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 23, 2); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p);
            frame++; f._sigCd = 1; evolutionTick(); const out = { dist: Math.hypot(p.x - f.x, p.y - f.y), dmg: 1e6 - p.health, stun: p.hitStun >= MANTA_STUN }; p.dead = true; return out; })()`);
        ok(r.dist < 1 && r.dmg > 0 && r.stun, 'the prism hood did not rush: ' + JSON.stringify(r));
    });

    check('the legacy VOLT RING still runs STATIC RUSH', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('electric'); const f = followers[0]; f.role = 'brawler'; f.evolved = 'voltring'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 23, 2); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p);
            frame++; f._sigCd = 1; evolutionTick(); const out = { dist: Math.hypot(p.x - f.x, p.y - f.y), dmg: 1e6 - p.health, stun: p.hitStun >= MANTA_STUN }; p.dead = true; return out; })()`);
        ok(r.dist < 1 && r.dmg > 0 && r.stun, 'the prism hood did not rush: ' + JSON.stringify(r));
    });

    check('the PRISM HOOD animates smoothly like the others: one idle frame per 7 steps, no twitch', () => {
        const r = run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower);
            spawnFollowerAtCrystal('electric'); const f = followers[0]; f.returningToCrystal = false; f.role = 'brawler'; f.evolved = 'prism'; f._moltAt = -1e9; f.x = 20; f.y = 2; f.dirX = 1; f.dirY = 0;
            const d = EVOLUTIONS.prism, cols = []; for (let i = 0; i < 28; i++) { frame++; cols.push(_evoFrame(f, d, frame).col); }
            return { tw: !!d.twitch, changes: cols.filter((c, i) => i && c !== cols[i - 1]).length }; })()`);
        ok(!r.tw, 'the prism hood still has a twitch'); ok(r.changes >= 3 && r.changes <= 5, 'it should advance a frame every 7 steps: ' + JSON.stringify(r));
    });

    console.log('\nIT STAYS EVOLVED');
    check('its role is fixed: a role switch skips it', () => {
        const r = run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower); ELEMENTS.forEach(e => { followerByElement[e.id] = []; }); if (typeof ccClearSelection === 'function') ccClearSelection();
            spawnFollowerAtCrystal('electric'); const e = followers[0]; e.role = 'sniper'; e.evolved = 'reaver';
            spawnFollowerAtCrystal('fire'); const p = followers[1]; p.role = 'brawler';
            selectedRole = null; squadMode = 'all'; cycleCommandPoolRoles();
            return { e: e.role, p: p.role }; })()`);
        same(r.e, 'sniper', 'the evolved one'); same(r.p, 'sniper', 'the other one (brawler → sniper)');
    });
    check('its role is put back if anything changes it', () => {
        const r = run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower);
            spawnFollowerAtCrystal('core'); const w = followers[0]; w.role = 'brawler'; w.evolved = 'warden'; w._moltAt = -1e9; w.role = 'camper';
            frame++; evolutionTick(); return { w: w.role }; })()`);
        same(r.w, 'brawler', 'the warden put back to its role');
    });
    check('it is saved, and loads back evolved with its boosted stats (the facility\'s save, js/facilitysave.js)', () => {
        const r = run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower); respawnQueue.length = 0;
            spawnFollowerAtCrystal('fire'); const f = followers[0]; f.role = 'brawler'; f.level = 25; f.xp = xpForLevel(25); _applyFollowerLevel(f, true); evoCheck(f);
            const snap = followerRosterSnapshot(); const hp = f.maxHealth;
            followers.length = 0; actors = actors.filter(a => !a.isFollower);
            spawnFollowerFromSave(snap[0]); const g = followers[0];
            return { saved: snap[0].evolved, evo: g.evolved, hp: g.maxHealth, was: hp }; })()`);
        same(r.saved, 'quillstone', 'in the save'); same(r.evo, 'quillstone', 'after loading'); same(r.hp, r.was, 'its health after loading');
    });
    check('it comes back from the dead as the same machine — its element and role too', () => {
        const r = run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower); respawnQueue.length = 0;
            spawnFollowerAtCrystal('electric'); const f = followers[0]; f.role = 'sniper'; f.level = 21; f.xp = xpForLevel(21); _applyFollowerLevel(f, true); evoCheck(f);
            f.health = 0; f.dead = true;
            for (let i = 0; i < 400 && !followers.some(x => !x.dead); i++) render();
            const g = followers.find(x => !x.dead);
            return g ? { evo: g.evolved, el: g.element, role: g.role } : null; })()`);
        ok(r, 'it never respawned');
        same(r.evo, 'thunderhead', 'its form'); same(r.el, 'electric', 'its element'); same(r.role, 'sniper', 'its role');
    });

    console.log('\nTHE LOOK');
    check('the sheets are in the build, 8 facings × 16 frames of 144 px', () => {
        for (const id of run('Object.keys(EVOLUTIONS)')) {
            const b = fs.readFileSync(path.join(ROOT, 'img/evo', id + '.png'));
            same(b.readUInt32BE(16) + 'x' + b.readUInt32BE(20), '2304x1152', id + ' size');
        }
        ok(/js\/evolution\.js/.test(fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8')), 'not loaded by the game');
    });
    check('the pools of material are on a sheet of their own (rotshard, mimic), the same size as the body sheet', () => {
        for (const id of ['rotshard', 'mimic', 'maw', 'seeper']) {
            const b = fs.readFileSync(path.join(ROOT, 'img/evo', id + '_g.png'));
            same(b.readUInt32BE(16) + 'x' + b.readUInt32BE(20), '2304x1152', id + ' ground sheet size');
            same(run('EVOLUTIONS.' + id + '.ground'), 'img/evo/' + id + '_g.png', id + ' ground path');
        }
        for (const id of run('Object.keys(EVOLUTIONS)').filter(id => !['rotshard', 'mimic', 'maw', 'seeper'].includes(id))) same(run('EVOLUTIONS.' + id + '.ground || null'), null, id + ' has no pool');
    });
    check('THE ASK: a pool lies on the FLOOR — painted by each floor tile, clipped to it, under whatever stands there — not drawn with the unit', () => {
        const r = run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower);
            const fake = { complete: true, naturalWidth: 2304 };
            EVOLUTIONS.rotshard._img = fake; EVOLUTIONS.rotshard._gimg = fake; EVOLUTIONS.mimic._img = fake; EVOLUTIONS.mimic._gimg = fake;
            canvas.width = 800; canvas.height = 600; player.visualX = 20; player.visualY = 2;
            const mk = (el, role, evo, x, y) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = role; f.evolved = evo; f._moltAt = -1e9; f.x = x; f.y = y; return f; };
            const a = mk('toxic', 'sniper', 'rotshard', 20.5, 2.5), b = mk('flux', 'brawler', 'mimic', 22.5, 2.5), egg = mk('fire', 'brawler', null, 20.5, 2.5);
            const rec = () => { const c = { draws: 0, clips: 0, ellipses: 0, globalAlpha: 1 }; for (const m of ['save', 'restore', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'fill', 'stroke', 'fillRect', 'arc', 'addColorStop']) c[m] = () => {};
                c.clip = () => { c.clips++; }; c.drawImage = () => { c.draws++; }; c.ellipse = () => { c.ellipses++; }; c.createRadialGradient = () => ({ addColorStop() {} }); return c; };
            evoGroundBegin();
            const onTile = (tx, ty) => { const g = rec(); drawEvoGroundOnTile(tx, ty, (tx - 20 - (ty - 2)) * TILE_W + 400, (tx - 20 + (ty - 2)) * TILE_H + 300, g); return g; };
            const out = { own: onTile(20, 2), front: onTile(19, 1), far: onTile(20, 8), other: onTile(22, 2), list: _evoGround.length };
            const body = rec(); drawEvolvedFollower(a, 300, 300, body); out.body = body;
            frame = frame + 1; a._moltAt = frame - 5; evoGroundBegin(); out.molting = _evoGround.length;   // still the egg: no pool yet
            return out; })()`);
        same(r.list, 2, 'two pools to paint (the egg has none)');
        ok(r.own.draws === 1 && r.own.clips === 1, 'its own tile paints its pool, clipped: ' + JSON.stringify(r.own));
        ok(r.front.draws === 1 && r.front.clips === 1, 'a neighbouring tile paints its share too: ' + JSON.stringify(r.front));
        same(r.far.draws, 0, 'a tile far from every pool paints none');
        ok(r.other.draws === 1, 'the other pool (the mimic\'s) is painted on its own tile: ' + JSON.stringify(r.other));
        ok(r.body.draws === 1 && r.body.ellipses === 0, 'the body is drawn with no pool in it and no shadow: ' + JSON.stringify(r.body));
        same(r.molting, 1, 'a molting follower paints no pool until it is out of the egg');
        const GAME = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
        ok(/_drawFloorTile\(ctx, px, py[^\n]*\n\s*if \(typeof drawEvoGroundOnTile === "function"\) drawEvoGroundOnTile\(obj\.x, obj\.y, px, py\)/.test(GAME), 'the floor tile does not paint the pools');
        ok(GAME.indexOf('evoGroundBegin()') > 0 && GAME.indexOf('evoGroundBegin()') < GAME.indexOf('drawList.forEach(obj=>{'), 'the ground list is not built before the world is drawn');
    });
    check('THE ASK: a bundle of followers stands a little further apart (FOLLOWER_SEP), so every unit shows', () => {
        ok(run('FOLLOWER_SEP') >= 0.7 && run('FOLLOWER_SEP') <= 1.0, 'FOLLOWER_SEP = ' + run('FOLLOWER_SEP'));
        const GAME = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
        ok(/FOLLOWER SEPARATION[\s\S]{0,1800}_SEP2 = FOLLOWER_SEP \* FOLLOWER_SEP[\s\S]{0,900}FOLLOWER_SEP - _d/.test(GAME), 'the separation pass does not use it');
        ok(!/>= 0\.55\) break|0\.3025/.test(GAME), 'a hard-coded 0.55 is left in the separation pass');
    });
    check('it is drawn in place of the egg (and the egg is drawn until the sheet has loaded)', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/draw.js'), 'utf8');
        ok(/drawEvolvedFollower\(actor, px, py, drawCtx\)\) \{\}\s*(else if \(_figOpts === null[^\n]*\n\s*)?else if \(_figOpts\)/.test(src), 'the follower body does not hand an evolved one over');
        const r = run(`(function(){ spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.evolved = 'bloom'; f._moltAt = -1e9;
            const drew = drawEvolvedFollower(f, 300, 300, ctx); drawNPC(f, 300, 300, ctx); f._moltAt = frame - 60; drawNPC(f, 300, 300, ctx); return drew; })()`);
        same(r, false, 'drawn with no sheet loaded');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
