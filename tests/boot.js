// BOOT — REPORTED (a phone): "CRASH — ReferenceError: Can't find variable:
// PREDATOR_TYPES, initPreview@dev.js:306". js/species.js never ran, and the
// first thing that needed it — the dev panel's preview — took the whole boot
// down. The crash screen stacked one panel per error, so the cause was hidden
// under the follow-on. These are source checks; tests/run.js cannot fetch.
const fs = require('fs');
const path = require('path');
const { ROOT, scriptOrder } = require('./domstub.js');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HTML = rd('game.html');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }

const bootAt = HTML.indexOf('// ── BOOT CHECK');
const boot = HTML.slice(bootAt, HTML.indexOf('</script>', bootAt));

check('THE ASK: a script that failed to download is caught (it raises no error of its own)', () => {
    ok(/addEventListener\("error", function \(e\) \{[\s\S]{0,200}t\.tagName === "SCRIPT"[\s\S]{0,200}\}, true\)/.test(HTML), 'no capture-phase listener for script load failures');
    ok(HTML.indexOf('window.__bootFailed = []') < HTML.indexOf('<script src="js/config.js">'), 'it is installed after the scripts start loading');
});
check('THE ASK: before init.js runs, every file is checked — species.js among them', () => {
    ok(bootAt > -1 && bootAt < HTML.indexOf('<script src="js/init.js">') && bootAt > HTML.indexOf('<script src="js/dev.js">'), 'the boot check is not between the files and init.js');
    ok(/"js\/species\.js": "PREDATOR_TYPES"/.test(boot), 'it does not check species.js');
    // Every name it checks is a real top-level declaration of that file.
    for (const [f, name] of [...boot.matchAll(/"(js\/[\w.]+)": "(\w+)"/g)].map(m => [m[1], m[2]])) {
        ok(scriptOrder().includes(f), f + ' is not loaded');
        ok(new RegExp('^(const|let|var|function|class) ' + name + '\\b', 'm').test(rd(f)), name + ' is not declared in ' + f);
    }
});
check('it reloads by itself, at most twice, with the count in the URL too (no endless loop without storage)', () => {
    ok(/if \(tries < 2\)/.test(boot) && /location\.reload\(\)/.test(boot), 'no bounded retry');
    ok(/location\.hash = "boot" \+ \(tries \+ 1\)/.test(boot) && /#boot\(\\d\)/.test(boot), 'the count is only in storage');
});
check('then it says which file, plainly, with a RELOAD button', () => {
    ok(/The game did not finish loading/.test(boot) && /missing\.join/.test(boot) && /RELOAD/.test(boot), 'no plain message');
});
check('the crash screen is one panel, first error on top, with RELOAD', () => {
    const s = HTML.slice(HTML.indexOf('function _showError'), HTML.indexOf('window.onerror'));
    ok(/if \(!_errPanel\)/.test(s) && /_errPanel\.appendChild\(block\)/.test(s), 'it still stacks a panel per error');
    ok(/RELOAD/.test(s), 'no reload button');
    ok(!/window\.onerror\s*=/.test(rd('js/config.js')), 'config.js still replaces the page\'s error handler');
});
check('the dev panel can never stop the game starting', () => {
    ok(/try \{ initPreview\(\); \} catch \(e\)/.test(rd('js/init.js')), 'initPreview is still unguarded');
});

console.log(failures ? `\n${failures} FAILING` : '\nall passing');
process.exit(failures ? 1 : 0);
