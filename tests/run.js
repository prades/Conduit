// Runs every Conduit test suite. `node tests/run.js`
const { execFileSync } = require('child_process');
const path = require('path');

const SUITES = [
    ['THE FOUNDATION: the facility is the whole game, nothing of the old strip game is left, a kill pays on the spot', 'foundation.js'],
    ['load order + render order', 'loadorder.js'],
    ['declared globals',         'globals.js'],
    ['boot check',               'boot.js'],
    ['the start: the start screen, the staged start, the sheets it waits for, failures and retries, the clock once, the readout', 'startup.js'],
    ['performance + culling',    'perf.js'],
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
    ['insect abilities',         'abtest.js'],
    ['attack facing',            'facing.js'],
    ['targeting rules',          'targets.js'],
    ['player weapon',            'weapon.js'],
    ['fire bombs',               'firebombs.js'],
    ['the player\'s ultimate',   'ultimate.js'],
    ['effects plan',             'effects.js'],
    ['combat readability: the bite in two beats, one bite one unit, the cap, the numbers, the bar, DEFEATED', 'combat.js'],
    ['whom a creature goes for: the player is prey (hit it and it comes for you), the weak first; spiders lurk behind props with no tag', 'prey.js'],
    ['the Mutator: the lash, cloning is the Mutator\'s, the one clone fights as its species and stays fallen', 'mutator.js'],
    ['the Ice Mage preserves a fallen ally; the player carries its capsule to the Resurrection Zone', 'specimen.js'],
    ['the Mutator\'s healing serum: a pool that heals, the laboratory, the Mutator\'s level', 'serum.js'],
    ['the Technomancer: the arc gauntlet punches in reach and stores charge, the arc spends it out of reach, jumps on and cuts a bite short; the grid charges it', 'technomancer.js'],
    ['each class\'s own stage after the tutorial, and its loop played through (the Gunslinger, the Technomancer, the Mutator)', 'classstage.js'],
    ['switching class: a confirmation on every pick, the pack\'s SWITCH CLASS, each class keeping its own progress (perks, stage, weapon, kit once, the Mutator\'s clone waiting), saved until the Crystal falls', 'classswitch.js'],
    ['the Sewers: the arena\'s overflow grates and culvert, the room under it (two ledges, the deep river, a bridge and a broken one, gated passages, the boss\'s cistern), the trip, the drawing', 'sewers.js'],
    ['EXILE: any follower let go for good from the roster (the Command Center, the phone\'s ROSTER cards; not the squad\'s own cards), asked first, nothing back; the word everywhere', 'exile.js'],
    ['equip cards: five subclasses on the 18 forms (the user\'s roster chart), two slots on every follower and two Universal on the player, fits, the hand, the ◆1,000 unlock that NEW GAME keeps, lives through respawn / EXILE / falling for good / re-roll, saved additively; the screens; inert test cards behind ?cards', 'cards.js'],
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
    ['squad of three, rooms the rest hold, the ammunition icon', 'party.js'],
    ['the objective is a mailbox on a phone: an envelope with a "!" for a new objective', 'mailbox.js'],
    ['the bottom of the screen: dock, squad bar, tool, enemy card: none over another', 'bottomui.js'],
    ['the squad in the Command Center (box, add / remove / swap, SQUADS window, disband, the phone\'s menu)', 'squadui.js'],
    ['HOLD one follower, then COME brings it back', 'holdcome.js'],
    ['room capacity, who makes room, the arena over its six', 'rooms.js'],
    ['the corners: the target\'s dial and ammunition bottom right, the objective under the network panel top right', 'corners.js'],
    ['a squad member\'s card on the fly: ALL instead of the element picker, a tap picks a member, INDEX and DISMISS FROM SQUAD', 'squadfly.js'],
    ['the technicians\' abilities: one table, one way in; the Kinetic Launcher\'s throw, its launcher site, the Arena Catwalk and its broken section', 'techabilities.js'],
    ['the other five technicians\' Level 1 abilities: the Photonic Shield, the Thermite Drill and the arena\'s rubble, the Frost Patch, the Blight Spider and the play clock, Telegrab', 'techlevel1.js'],
    ['the Sewer purification: the water-sample puzzle (Telegrab, or the launcher and the drill), the quest\'s states, the toxic brood and its samples, the bench and the ◆800 module, the boss gate, the mount and the cycle, the boss (calm alive, or defeated), the saves', 'sewerquest.js'],
    ['Series 2: the plumbing for the species cards and the class cards (the pack in the list with no numbers, fits, bonuses that add and come off, the ability-cooldown stat, the saves, the roll and the shelf when it is on sale)', 'series2.js'],
    ['the Command Center as a carousel', 'carousel.js'],
    ['facility play',            'facilityplay.js'],
    ['facility map',             'facility.js'],
    ['attract screen (website background)', 'attract.js'],
];

let failed = 0;
for (const [label, file] of SUITES) {
    process.stdout.write(`\n══ ${label} (${file})\n`);
    try {
        process.stdout.write(execFileSync(process.execPath, [path.join(__dirname, file)],
                                          { encoding: 'utf8' }));
    } catch (e) {
        failed++;
        process.stdout.write((e.stdout || '') + (e.stderr || ''));
        process.stdout.write(`\n✗ ${label} FAILED\n`);
    }
}
console.log(failed ? `\n${failed} suite(s) failing\n` : '\nall suites passing\n');
process.exit(failed ? 1 : 0);
