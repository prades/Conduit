// NO SIGNAL TOWERS: "remove those little red arrow things with a line through them in the middle of the zones." Zones 4 and beyond used to get a red SIGNAL TOWER at their centre (a capturable antenna that
// gave the enemy territory until it was hacked). Nothing builds one now, and the guide no longer describes it.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
(async () => {
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    run('gameState.running = true; zoneGenerated = () => true; ensureWorldTo(9 * ZONE_LENGTH);');
    console.log('\nNO SIGNAL TOWERS');
    check('nine zones are built and not one tile in them is a signal tower, and the list of towers is empty', () => {
        ok(run('getZoneIndex(world[world.length - 1].x)') >= 6, 'fixture: the zones were not built');
        ok(run('world.filter(t => t.nodeType === "signal_tower" || t.capturable).length') === 0, 'a signal tower was built');
        ok(run('signalTowers.length') === 0, 'signalTowers is not empty');
    });
    check('the world generator no longer places one, and the guide does not describe them', () => {
        ok(!/signalTowers\.push|nodeType = 'signal_tower'/.test(rd('js/world.js')), 'world.js still places them');
        ok(!/SIGNAL TOWER<\/div>|Capturing<\/span> a Signal Tower/.test(rd('game.html')), 'the guide still describes them');
    });
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
