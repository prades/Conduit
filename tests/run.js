// Runs every Conduit test suite. `node tests/run.js`
const { execFileSync } = require('child_process');
const path = require('path');

const SUITES = [
    ['postfx pipeline',        'fxtest.js'],
    ['postfx startup paths',   'tdz.js'],
    ['load order + render seam','loadorder.js'],
    ['insect abilities',       'abtest.js'],
    ['nest persistence',       'nests.js'],
    ['pylon linking',          'pylons.js'],
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
