// Runs every Conduit test suite. `node tests/run.js`
// The suites run side by side, one per core (the owner, 2026-11-10: "What can be done about long testing periods"; one at a time a full run took 28 minutes, four at a time 12),
// each in its own process; each suite's output is printed whole, in the list's order, so a run reads as it always did (scratchpad comparisons parse the same "══ … (file.js)"
// headers and "  FAIL" lines). After each suite: its time.
//   node tests/run.js                     every suite, as many at once as there are cores
//   node tests/run.js --jobs=1            one at a time, as before
//   node tests/run.js moves bible         only the suites named (with or without .js)
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const SUITES = [
    ['THE FOUNDATION: the facility is the whole game, nothing of the old strip game is left, a kill pays on the spot', 'foundation.js'],
    ['load order + render order', 'loadorder.js'],
    ['declared globals',         'globals.js'],
    ['boot check',               'boot.js'],
    ['the start: the start screen, the staged start, the sheets it waits for, failures and retries, the clock once, the readout', 'startup.js'],
    ['phones are told to play on an iPad (the rule, and the real page as an iPhone, an iPad today and an old one, ?anydevice, ?attract)', 'phonegate.js'],
    ['the players\' page: play.html and its one script (dist/conduit.js) fresh, the boot check kept, the way in from game.html, and the same names as file by file in a real browser', 'bundle.js'],
    ['the balance page: balance.html fresh from the code, every form on it, no history, the measured table named by build', 'balance.js'],
    ['the pictures for players: js/imgmap.js and the WebP copies fresh, each WebP exact and smaller, every loader asking at the map\'s address, and each WebP as its PNG in a real browser', 'images.js'],
    ['the electrical domain (step 1): the little door beside the junction, shut until it is repaired; the deep server room and down four steps the circuitry; one interior of two rooms', 'elecdomain.js'],
    ['the player\'s part in a fight: the bars come back slowly out of danger; the repair kit (the pack, the KIT pill, H); kits dropped by creatures and at spots that fill again; GUARD (shots at the squad near you hit you, half speed) and STUN DIVE (a swoop, a stun, a rest)', 'playercombat.js'],
    ['the battle look: the battle view when a creature engages (1.25x, the edges blurred on HIGH, darkened on LOW), taps through the zoom, the floor first and written on (lit tiles, a creature\'s bar with its level and element, WEAK! and STUNNED), no names, RESIST off like nothing, objects in front of a fighter as ghosts; the faces; the real page', 'battlelook.js'],
    ['performance + culling',    'perf.js'],
    ['the rock painted once: each rock piece and bend stamped from a picture of its own, the frame the same as drawn live; drawn live while its light changes, as a ghost, without a canvas; the pictures\' budget', 'rockpics.js'],
    ['the Electro Skink\'s swirl: its everyday hit a vortex at the enemy and one hit as it closes, no chain, its body hidden and back, every other electric follower keeps its chain, its sheet baked and cropped', 'skinkswirl.js'],
    ['the Thunderhead\'s STATIC VORTEX as a dark storm (design C of six, baked from three.js): the mechanics as they were, its sheet baked and cropped, which frame, nothing flat on the floor, grown and faded, gone with its life', 'tornado.js'],
    ['the Quillstone\'s attacks: its sheet baked and cropped (40 columns), QUILL BURST\'s turn, its quills leaving after it, the bare second and the regrowth in order, the everyday hit\'s dive', 'quillstone.js'],
    ['the Frost Maw\'s attacks: CHOMP drops giant jaws and bites as they shut (once, on the enemy as it is then, none from a dead Maw), the reach and wait as they were, its sheets baked and cropped', 'mawattacks.js'],
    ['the Rift Mimic\'s shard shot: its everyday hit a shard that rises, is shot at the enemy and grows back, the hit it always was landing with it (once, none from a dead Mimic), the cells in order, its sheet baked and cropped', 'mimicshot.js'],
    ['code cards and the naming system: a code (\"Kylie\" or \"frommatt\") gives a level 20 mantis tank clone named Emotional Support once a save, the Mutator\'s primary clone, not used up with a clone out or before a run; the name, its cleaning and its save; the shop tab\'s box', 'redeem.js'],
    ['the Ember Hood\'s flare: its everyday FIREBALL\'s hood swells and a fireball forms over the shot\'s wind-up, the cells in order, the shot as it was, none after a cancelled wind-up, its sheet baked and cropped', 'hoodflare.js'],
    ['the clock (game speed)',   'clock.js'],
    ['a step with no picture = a drawn step (lock-step equivalence)', 'ghost.js'],
    ['levels and stats',         'levels.js'],
    ['the beetle, rebuilt',      'beetle.js'],
    ['every predator species, rebuilt', 'bugs3d.js'],
    ['3D player + egg sprites',  'hdsprites.js'],
    ['three hits, then the Crystal', 'threehits.js'],
    ['no player stun',           'stun.js'],
    ['the Crystal heals between alarms', 'pressure.js'],
    ['follower evolutions',      'evolution.js'],
    ['the moves table',          'moves.js'],
    ['the follower combat redesign: QUILL BURST\'s five quills, FIREBALL, HEXFIRE\'s stationary circle, SONIC ROLL kept, PINBALL\'s ricochet, CHAIN LIGHTNING by distance, STATIC VORTEX; the Hover Shell and its Kinetic Launcher unchanged', 'followercombat.js'],
    ['insect abilities',         'abtest.js'],
    ['attack facing',            'facing.js'],
    ['targeting rules',          'targets.js'],
    ['player weapon',            'weapon.js'],
    ['fire bombs',               'firebombs.js'],
    ['the hazard containers: explosive and corrosive flasks (a shot sets one off, a blast or an acid pool, back after a minute), moved by FLUX MOVE', 'hazards.js'],
    ['the player\'s ultimate',   'ultimate.js'],
    ['effects plan',             'effects.js'],
    ['combat readability: the bite in two beats, one bite one unit, the cap, the numbers, the bar; no DEFEATED (taken out, build 2026-11-11g)', 'combat.js'],
    ['the damage system: six types, race and subclass rows, the physical/elemental split, the triangle on the elemental part, leans, the words', 'damage.js'],
    ['whom a creature goes for: the player is prey (hit it and it comes for you), the weak first; spiders lurk behind props with no tag', 'prey.js'],
    ['the Mutator: the lash, cloning is the Mutator\'s, the one clone fights as its species and stays fallen', 'mutator.js'],
    ['the Ice Mage preserves a fallen ally; the player carries its capsule to the Resurrection Zone', 'specimen.js'],
    ['the Mutator\'s healing serum: a pool that heals, the laboratory, the Mutator\'s level', 'serum.js'],
    ['the Technomancer: the arc gauntlet punches in reach and stores charge, the arc spends it out of reach, jumps on and cuts a bite short; the grid charges it', 'technomancer.js'],
    ['each class\'s own stage after the tutorial, and its loop played through (the Gunslinger, the Technomancer, the Mutator)', 'classstage.js'],
    ['switching class: a confirmation on every pick, the pack\'s SWITCH CLASS, each class keeping its own progress (perks, stage, weapon, kit once, the Mutator\'s clone waiting), saved until the Crystal falls', 'classswitch.js'],
    ['the Sewers: the arena\'s overflow grates and culvert, the room under it (two ledges, the deep river, a bridge and a broken one, gated passages, the boss\'s cistern), the trip, the drawing', 'sewers.js'],
    ['EXILE: any follower let go for good from the roster (the Command Center, the phone\'s ROSTER cards; not the squad\'s own cards), asked first, nothing back; the word everywhere', 'exile.js'],
    ['equip cards: five subclasses on the 18 forms (the user\'s roster chart), two slots on every follower and two Player-card slots on the player, fits, the hand, the ◆1,000 unlock that NEW GAME keeps, lives through respawn / EXILE / falling for good / re-roll, saved additively; the screens; inert test cards behind ?cards', 'cards.js'],
    ['EQUIP NOW: a card put on from the collection or a pack\'s reveal; the followers it fits in a pop-out, each with its slots (EQUIP HERE, SWITCH, WORN); a card kept for good goes into the hand as it goes on; a Player card on you, a card attack in its SPECIAL ATTACK slot', 'equipnow.js'],
    ['second attacks for every follower (BASH where the design notes give none, and before evolving; CAPACITOR DISCHARGE in PINBALL\'s place; CORRODE SHOT the Rotshard\'s shot) and the Ultimates on the squad cards (a meter, a tap fires it) and a bigger bar over each follower', 'secondattacks.js'],
    ['the six Crystalline equip cards: the approved names, classes and +50% (attack damage, maximum health, elemental attack power, attack speed), each alone, in the fight, together (different stats independent, the same stat adds), the health rule, who can wear what, the save, a respawn and a restored body, the screens', 'crystalline.js'],
    ['Pack 1: the eighteen Element cards, the 100-shard booster pack (4 cards, one Precision at least, 60 / 30 / 10, none twice, seedable), found cards and the 1,000-shard keep, the stat cards and the on-hit statuses (Burn, Poison = weakness, Glitch, Slow, Siphon, Knockback), leaving, saving, a fight with every card, the screens', 'packs.js'],
    ['the market: credits from a pack\'s duplicates (25% of a card\'s value, 90 / 150 / 250 / 350 / 500 / 650), a shelf of six cards you do not have that changes every 5 game-minutes, buying with credits or the same number of shards (a new card is kept for good and found), saving, NEW GAME, the screens', 'market.js'],
    ['the game bible: every number it quotes is the code\'s, its pictures and links, its card on the home page, a phone\'s width', 'bible.js'],
    ['follower bonds',           'bonds.js'],
    ['traits + hybrid',          'traits.js'],
    ['follower types',           'followertypes.js'],
    ['follower spots, all elements, sturdier followers', 'followerspots.js'],
    ['clone cost',               'clones.js'],
    ['clone card strip',         'clonecards.js'],
    ['unit status + hold fix',   'status.js'],
    ['unit name plate',          'plate.js'],
    ['unit info tab',            'unitinfo.js'],
    ['INFO panel + ring',        'infodex.js'],
    ['game index + icons',       'index.js'],
    ['HUD layout',               'hud.js'],
    ['shard gems + alarm',       'hudgems.js'],
    ['visible area (iPad)',      'visiblearea.js'],
    ['phone radial menu',        'radialmenu.js'],
    ['command center',           'commandcenter.js'],
    ['roster + command merged',  'ccmerge.js'],
    ['sliding toolbox',          'toolbox.js'],
    ['mix selector',             'mixtool.js'],
    ['enemy card: no ELEMENTS tab, tap the card to send the squad', 'enemycard.js'],
    ['THE CORE: your cube in the bottom-right corner (its face, GUARD and STUN, the PACK lid, ARMY SURGE, the bars and shards)', 'corehud.js'],
    ['squad of three, rooms the rest hold, the ammunition icon', 'party.js'],
    ['the dialogue box: whoever is talking at the bottom of the screen with their picture (the Crystal gives the tutorial and the class\'s stage, you note the quest line, Side Quest talks at his station), the quest box on the menu with a "!" for a new objective, the objective plate hidden', 'dialogue.js'],
    ['the bottom of the screen: dock, squad bar, tool, enemy card: none over another', 'bottomui.js'],
    ['the squad in the Command Center (box, add / remove / swap, SQUADS window, disband, the phone\'s menu)', 'squadui.js'],
    ['HOLD one follower, then COME brings it back', 'holdcome.js'],
    ['the formation: Brawlers ahead of you, Mages behind at a distance, Technicians going round you, while they follow you; a Mage shoots from its place; walls; who takes a place', 'formation.js'],
    ['the Mutator\'s clone in the squad: its card after the three on the bar, picked alone with a tap, the orders (RETREAT, HOLD, COME, ALL, the enemy card\'s ATTACK), the squad\'s XP, a doorway, a load; SWITCH ROLES leaves it alone', 'clonesquad.js'],
    ['where a tap may send you: the room you are in and a little way through its doorways (a stray tap elsewhere is ignored, with a ✕); the five-tile step under pressure, a prototype the Settings turn off', 'movement.js'],
    ['room capacity, who makes room, the arena over its six', 'rooms.js'],
    ['the corners: the target\'s dial and ammunition bottom right, the place\'s corner without the objective plate (the quest box has it)', 'corners.js'],
    ['a squad member\'s card on the fly: ALL instead of the element picker, a tap picks a member, INDEX and DISMISS FROM SQUAD', 'squadfly.js'],
    ['the technicians\' abilities: one table, one way in; the Kinetic Launcher\'s throw, its launcher site, the Arena Catwalk and the catwalks\' ledge', 'techabilities.js'],
    ['the other five technicians\' Level 1 abilities: the Photonic Shield, the Thermite Drill and the arena\'s rubble, the Frost Patch, the Blight Spider and the play clock, FLUX MOVE\'s chip', 'techlevel1.js'],
    ['REEF, the coral crab\'s (BLOOM\'s Technician): the outcrop that blocks and mends, the climbs onto any high ground over floor (you and your followers, both ways, one each, not through glass nor from ice, saved), and REEF PILLAR, its Ultimate', 'reef.js'],
    ['FLUX MOVE, the flux technician\'s object tool: what moves, its 2-tile reach (a square), the whole footprint, the kept spots, the bodies, the floor never cut in two, a barrier turned, one transaction in the map (the floor, the routes, the drawing), the save', 'fluxmove.js'],
    ['the Flux test room (?fluxlab): without the flag the game as it was; with it the room (an interior, a doorway pair, the roadmap\'s objects, the narrow passage, the objective behind the barrier), the start in it, nothing kept, its creatures, FLUX MOVE played out on its layout, the real page', 'fluxlab.js'],
    ['walls, cover and sight (Milestone Two): what each kind of object does, sight over low objects and not through walls, glass or tall ones, a shot stopped at a wall, at cover (not the shooter\'s own) or at a tall object, lobs over, the laser\'s beam, the shooters firing at what they see, the moves that strike at once needing sight, FLUX MOVE carrying cover, the real page', 'cover.js'],
    ['the Sewer purification: the water-sample puzzle (two ways, each on its own: the launcher carrying the player over the choke and the jump back down; the drill through the choke from the ledge; Telegrab\'s went with Telegrab), the quest\'s states, the toxic brood and its samples, the bench and the ◆300 module, the boss gate, the mount and the cycle, the boss (calm alive, or defeated), the saves', 'sewerquest.js'],
    ['the Ant Nest (docs/NEST.md): the big egg cavern beyond the arena\'s south rock, an interior; the way in through the hole drilled in the arena\'s south rubble (shut until it is drilled), the tunnel mouth back up, the squad along, the save', 'nest.js'],
    ['the conversion at the purification module (docs/CONVERSION.md): BLOOM, the seventh element (never found, ×1 both ways, MEND on every hit); the installed module converts a toxic follower in the squad or holding the Sewers; who cannot yet says why; the element changes, the rest stays, toxic cards come off, saved; the two pop-ups in the real page', 'conversion.js'],
    ['who lives where: the races and the spawn tables (the arena\'s ants, the Sewers\' toxic brood, the queen\'s infantry; a later stage and a second race are data), the Nest\'s state read from the queen\'s encounter and the purification, the brood following it', 'population.js'],
    ['the Crystal\'s power (one pool: turret shots, revivals, a reserve, the idle refill, the meter\'s charge at ◆50), the three turrets (sturdy, wrecked, repaired in ten seconds, saved) and the ant raids (every three minutes once the Sewers are found, three ants, turrets first, then the Crystal)', 'antraids.js'],
    ['Series 2: the species and class cards (its 45 cards since Build B, ◆150 by 50 / 30 / 15 / 5 up to Prototype, locked until the purification; fits, bonuses that add and come off, the ability-cooldown stat, the saves, the roll, the shelf of the open packs)', 'series2.js'],
    ['Series 2\'s Prototype abilities (shell block, regrowth, nova, overclock, absorb, double charge; cleave and chain cut with their cards) and the new Precision kinds (attuned core, two stats)', 'series2abilities.js'],
    ['the class card families (Build B): the Mage auras (reach, tiers, stacking, the clone, the Prototype status, the ring and glints), the Brawler opportunity cards (each opening, added up), Series 2 dealing 45, the cut cards\' clean-up and refund paid once, the Universal kind retired', 'classcards.js'],
    ['the Player cards (build 2026-11-02h): the Gunslinger\'s six roles and their words; a role needs its class, one of a class at a time, asleep after a switch and kept through a save; each kit on a round that lands (the role\'s element for the triangle only, BURN, WEAKNESS, the ARC SLINGER\'s jump, CRYO MARKSMAN\'s slow, freeze and slower guns, RIFT RUNNER\'s pull, BREACH GUNNER\'s knockback) on the service gun, the machine gun and the laser; a role asleep greyed on the roster', 'playercards.js'],
    ['the nine second attacks in place of BASH (build 2026-11-09c): ZIGZAG DASH, WOBBLE SLAM, ICICLE VOLLEY, ECHO PULSE, SHELL GUARD, PHASE SWAP, VENOM BITE, SHOCK ZAP, SKATE CHARGE; the Electro Skink\'s LIGHTNING CIRCUIT; a saved BASH carried over; the retired forms not flagged', 'ninemoves.js'],
    ['the forms\' effect pieces in 3D (build 2026-11-09e; docs/EFFECTS.md): the QUILLSTONE\'s modelled quill, its sheet, on the preview (?fx=3d) until approved in the game, its arc, shadow and cost', 'fx3d.js'],
    ['the cave\'s rock walls, modelled (build 2026-11-09i): every rock piece\'s strip, the bake current with the walls, the sheets, flush runs, the preview (?walls=3d), the dim rooms, the cull; the rubble modelled in the same rock (build 2026-11-09k): every patch\'s stages, its seams, the preview, the fallback, what a choke leaves', 'cavewalls.js'],
    ['BLOOM\'s nine cards (build 2026-11-09a): SAP VEIN, NECTAR HEART and DEWBURST (MEND made bigger; ATTUNED CORE\'s DEWBURST), THORN BAND, PETAL SIGIL and EVERBLOOM CROWN (its extra a MEND), SEED GUNNER\'s seedfall, GROVE ENGINEER\'s relays, HERBALIST\'s bites and pool; the player\'s own strikes mend nothing; dealt only once the purification module has run', 'bloomcards.js'],
    ['ENERGY CARDS (docs/ENERGY-CARDS.md; build 2026-11-09s): a follower\'s element from the card it holds (none: NO ELEMENT), evolving at level 8 with one (the card used up), its second attack then its Ultimate from cards of its element, a hybrid from another\'s (not designed yet), counted copies, the packs\' 2 a pack, the saves and old saves', 'energycards.js'],
    ['the Sleeping Potion: two rows of the pack, the universal pill and key, the throw (at your feet, or on the creature you have locked), the sleep that cancels a bite and lands nothing, the original on your followers too and never you, the copy on enemies only for a quarter, the prices (◆100, ◆50 after the queen, ◆100 lost), the lab\'s copy, the save', 'potion.js'],
    ['Side Quest: the void walker on the Sewers\' maintenance platform (after the lab turn-in and ten brood kills, not before), the call, the talk and the archive\'s opening, the promise as a choice that changes nothing, "…" once the queen\'s fate is decided, the shop, his look (the old flux worker\'s sheet, in the world and the dialogue box), the save', 'sidequest.js'],
    ['follower progression: the recruitment posts claimed once for ◆200 (short of it nothing moves; the squad-full question; saved), breeding a bonded pair\'s offspring for ◆50 (its element an even toss between its parents\', its class an even draw among the three, seedable; the formula, deterministic and better raised, applied once through level-ups, loads, respawns and bodies; two taps; the squad-full question), a death that costs nothing, the Vital items gone', 'followerprog.js'],
    ['the Command Center as a carousel', 'carousel.js'],
    ['the 3D cards and the followers\' backdrops: a texture for each element and class, the tilted slab with its crystal or cube and its hologram, a follower\'s element under its class on every card', 'cardart.js'],
    ['the species\' looks (the following update\'s Part 2): each species\' texture as approved on its cards and as a third layer on its followers, the seventeen emblems where the mockups put them, the enemy card\'s race emblem and its WEAK / RESISTS row from COMBAT.md §7.3', 'speciesart.js'],
    ['facility play',            'facilityplay.js'],
    ['facility map',             'facility.js'],
    ['attract screen (website background)', 'attract.js'],
];

const args = process.argv.slice(2);
const jobsArg = args.find(a => /^--jobs=\d+$/.test(a));
const JOBS = Math.max(1, jobsArg ? parseInt(jobsArg.slice(7), 10) : parseInt(process.env.TEST_JOBS || '', 10) || (os.cpus() || []).length || 1);
const named = args.filter(a => !a.startsWith('--')).map(a => a.replace(/\.js$/, '') + '.js');
const unknown = named.filter(n => !SUITES.some(s => s[1] === n));
if (unknown.length) { console.error('no such suite: ' + unknown.join(', ')); process.exit(2); }
const list = named.length ? SUITES.filter(s => named.includes(s[1])) : SUITES;

// one suite in its own process: its whole output (stdout, then stderr) and whether it passed
function runSuite(file) {
    return new Promise(resolve => {
        const t0 = Date.now(), out = [], err = [];
        const child = spawn(process.execPath, [path.join(__dirname, file)], { stdio: ['ignore', 'pipe', 'pipe'] });
        child.stdout.on('data', d => out.push(d)); child.stderr.on('data', d => err.push(d));
        child.on('error', e => err.push(Buffer.from(String(e && e.stack || e))));
        child.on('close', code => resolve({ ok: code === 0, out: Buffer.concat(out).toString('utf8'), err: Buffer.concat(err).toString('utf8'), secs: (Date.now() - t0) / 1000 }));
    });
}

(async () => {
    const t0 = Date.now(), done = new Array(list.length), times = [];
    let next = 0, shown = 0, failed = 0;
    // print every finished suite whose turn has come (the list's order), so the output is the same whatever finishes first
    const flush = () => {
        while (shown < list.length && done[shown]) {
            const [label, file] = list[shown], r = done[shown];
            process.stdout.write(`\n══ ${label} (${file})\n`);
            if (r.ok) { process.stdout.write(r.out); if (r.err) process.stderr.write(r.err); }   // (a passing suite's stderr goes where it always went)
            else { failed++; process.stdout.write(r.out + r.err); process.stdout.write(`\n✗ ${label} FAILED\n`); }
            process.stdout.write(`  (${r.secs.toFixed(1)} s)\n`);
            times.push([file, r.secs]); shown++;
        }
    };
    const worker = async () => { while (next < list.length) { const i = next++; done[i] = await runSuite(list[i][1]); flush(); } };
    await Promise.all(Array.from({ length: Math.min(JOBS, list.length) }, worker));
    flush();
    const slow = times.slice().sort((a, b) => b[1] - a[1]).slice(0, 5).map(([f, s]) => f.replace(/\.js$/, '') + ' ' + s.toFixed(0) + ' s').join(', ');
    console.log(`\n${list.length} suite(s), ${JOBS} at a time, ${((Date.now() - t0) / 60000).toFixed(1)} min; the slowest: ${slow}`);
    console.log(failed ? `\n${failed} suite(s) failing\n` : '\nall suites passing\n');
    process.exit(failed ? 1 : 0);
})();
