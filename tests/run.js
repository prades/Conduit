// Runs every Conduit test suite. `node tests/run.js`
const { execFileSync } = require('child_process');
const path = require('path');

const SUITES = [
    ['load order + render order','loadorder.js'],
    ['performance + culling',  'perf.js'],
    ['declared globals',       'globals.js'],
    ['insect abilities',       'abtest.js'],
    ['nest persistence',       'nests.js'],
    ['pylon linking',          'pylons.js'],
    ['attack facing',          'facing.js'],
    ['pylon codex',            'codex.js'],
    ['save & refresh',         'persist.js'],
    ['player weapon',          'weapon.js'],
    ['charged mass',           'mass.js'],
    ['pylon aggro',            'pylonaggro.js'],
    ['reset game',             'reset.js'],
    ['tutorial',               'tutorial.js'],
    ['no player stun',         'stun.js'],
    ['progression',            'progression.js'],
    ['modulation',             'modulation.js'],
    ['ultimate + pylon cost',  'ultimate.js'],
    ['generator pylon',        'generator.js'],
    ['pylon look',             'pylonlook.js'],
    ['infestation',            'infest.js'],
    ['spawn vortex',           'vortex.js'],
    ['targeting rules',        'targets.js'],
    ['repel + ice block',      'crew.js'],
    ['reclaim + upgrade',      'reclaim.js'],
    ['clone cost',             'clones.js'],
    ['early economy',          'economy.js'],
    ['portal + aura',          'homebase.js'],
    ['HUD layout',             'hud.js'],
    ['walkable bounds',        'bounds.js'],
    ['power grid',             'power.js'],
    ['connector pylon',        'connector.js'],
    ['electric haste',         'haste.js'],
    ['traits + hybrid',        'traits.js'],
    ['pressure + regen',       'pressure.js'],
    ['player-facing clarity',  'ux.js'],
    ['generator switch + turret','gunswitch.js'],
    ['cables on the floor',    'cables.js'],
    ['predator progression',   'broods.js'],
    ['nest grids + switch',    'grid.js'],
    ['convert + build by kind','convert.js'],
    ['power chain + tier III', 'chain.js'],
    ['support + disruption wake','wake.js'],
    ['element combos',         'combo.js'],
    ['overcharge',             'overcharge.js'],
    ['night sieges',           'siege.js'],
    ['follower bonds',         'bonds.js'],
    ['brood tyrant fight',     'tyrant.js'],
    ['autoplay',               'autoplay.js'],
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
