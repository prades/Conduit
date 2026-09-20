// Runs every Conduit test suite. `node tests/run.js`
const { execFileSync } = require('child_process');
const path = require('path');

const SUITES = [
    ['load order + render order','loadorder.js'],
    ['insect abilities',       'abtest.js'],
    ['nest persistence',       'nests.js'],
    ['pylon linking',          'pylons.js'],
    ['attack facing',          'facing.js'],
    ['pylon codex',            'codex.js'],
    ['nest linking',           'nestlink.js'],
    ['save & refresh',         'persist.js'],
    ['player weapon',          'weapon.js'],
    ['charged mass',           'mass.js'],
    ['pylon aggro',            'pylonaggro.js'],
    ['reset game',             'reset.js'],
    ['tutorial',               'tutorial.js'],
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
