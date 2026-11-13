// THE BALANCE PAGE (build 2026-11-13q; tools/balance.js; the owner, 2026-11-13: "simplify that for me ... we're trying to make it to where we can balance everything"):
//   FRESH       balance.html is what tools/balance.js makes from the code now (node tools/stamp.js makes it for every build; node tools/balance.js makes it alone)
//   WHAT IT HAS every evolved form once, with its stats, everyday type and status, each move and its Ultimate as its INFO card says them (so none says "not designed yet" or "locked"),
//               the measured table when design/balance-trial.json is there (the trial itself, tools/balance-trial.js, takes minutes and is not run here); no build history on the page
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' \u2014 ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
(async () => {
    const B = require(path.join(ROOT, 'tools/balance.js')), html = await B.make();
    group('THE BALANCE PAGE');
    check('balance.html is what the code makes now (node tools/balance.js)', () => ok(rd('balance.html') === html, 'stale: run node tools/balance.js'));
    check('every evolved form is on it once, none says "not designed yet" or "locked", and no build history is on it', () => {
        const forms = html.split('<tr><td><b>').length - 1;
        ok(forms >= 21 * 2, 'forms listed: ' + forms);
        ok(!/NOT DESIGNED YET/i.test(html), 'a form has no Ultimate yet'); ok(!/LOCKED/.test(html), 'an Ultimate showed locked');
        ok(!/\bsince build\b|\bthe owner\b/i.test(html), 'history on the page');
    });
    check('the measured table is there and says which build it was run on', () => { ok(/Measured: damage per second/.test(html), 'no measured table'); ok(/was run on build <b>20\d\d-\d\d-\d\d[a-z]+<\/b>/.test(html), 'no build named'); });
    console.log(failures ? '\n' + failures + ' FAILING' : '\nall passing'); process.exit(failures ? 1 : 0);
})();
