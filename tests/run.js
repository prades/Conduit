// Runs every Conduit test suite. `node tests/run.js`
const { execFileSync } = require('child_process');
const path = require('path');

const SUITES = [
    ['THE FOUNDATION: the facility is the whole game, nothing of the old strip game is left, a kill pays on the spot', 'foundation.js'],
    ['load order + render order', 'loadorder.js'],
    ['declared globals',         'globals.js'],
    ['boot check',               'boot.js'],
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
    ['the corners: the target\'s dial and ammunition bottom right, the objective under the network panel top right', 'corners.js'],
    ['a squad member\'s card on the fly: ALL instead of the element picker, a tap picks a member, INDEX and DISMISS FROM SQUAD', 'squadfly.js'],
    ['the technicians\' abilities: one table, one way in; the Kinetic Launcher\'s throw, its launcher site, the Arena Catwalk and its broken section', 'techabilities.js'],
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
