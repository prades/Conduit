// BOOT — REPORTED (a phone): "CRASH — ReferenceError: Can't find variable:
// PREDATOR_TYPES". js/species.js never ran, and the first thing that needed it
// took the whole boot down. The crash screen stacked one panel per error, so
// the cause was hidden under the follow-on. Now game.html's BOOT CHECK, between
// the last game script and js/init.js, probes one declaration from each file it
// loads, reloads by itself when one is missing, and otherwise says which file.
// These are source checks; tests/run.js cannot fetch.
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
    ok(HTML.indexOf('window.__bootFailed = []') < HTML.indexOf('<script src="js/config.js'), 'it is installed after the scripts start loading');
});
check('THE ASK: before init.js runs, every file is checked — species.js among them', () => {
    const order = scriptOrder(), last = order[order.length - 2];   // the last game script before init.js
    ok(bootAt > -1 && bootAt < HTML.indexOf('<script src="js/init.js') && bootAt > HTML.indexOf('<script src="' + last), 'the boot check is not between the files and init.js');
    ok(/"js\/species\.js": "PREDATOR_TYPES"/.test(boot), 'it does not check species.js');
    // Every name it checks is a real top-level declaration of a file the page loads: a probe for a file that is gone would fail every boot.
    const probes = [...boot.matchAll(/"(js\/[\w.]+)": "(\w+)"/g)].map(m => [m[1], m[2]]);
    ok(probes.length >= 20, 'only ' + probes.length + ' files are probed');
    for (const [f, name] of probes) {
        ok(order.includes(f), f + ' is not loaded');
        ok(new RegExp('^(const|let|var|function|class) ' + name + '\\b', 'm').test(rd(f)), name + ' is not declared in ' + f);
    }
    for (const f of ['js/facilityplay.js', 'js/party.js', 'js/mixtool.js', 'js/game.js']) ok(probes.some(p => p[0] === f), f + ' is not probed');   // the facility's own files are checked too
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
check('init.js starts the one game the page has, synchronously, and fetches nothing', () => {
    // The strip game's loadConfig awaited two fetches, so its boot crash lived in an async continuation nobody saw (tests/globals.js).
    const init = rd('js/init.js');
    ok(/function loadConfig\(\)/.test(init) && !/async|await|fetch\(/.test(init), 'loadConfig is async again, or fetches');
    ok(/facilityPlayStart\(\);/.test(init) && /gameLoop\(\);/.test(init) && /^loadConfig\(\);/m.test(init), 'init.js does not boot the facility and start the clock');
});

check('THE ASK: every file is fetched for this build — one ?v= on every script, matching the page and config.js', () => {
    const tags = [...HTML.matchAll(/<script src="js\/[^"?]+\?v=([^"]+)"><\/script>/g)].map(m => m[1]);
    const all = (HTML.match(/<script src="js\//g) || []).length;
    ok(tags.length === all && all > 30, tags.length + ' of ' + all + ' script tags carry a version');
    ok(new Set(tags).size === 1, 'the versions differ: ' + [...new Set(tags)].join(', '));
    const page = (HTML.match(/window\.__PAGE_BUILD = "([^"]+)"/) || [])[1], cfg = (rd('js/config.js').match(/const BUILD_VERSION = "([^"]+)"/) || [])[1];
    ok(page === tags[0] && cfg === tags[0], 'page ' + page + ', config ' + cfg + ', tags ' + tags[0]);
    ok(/BUILD_VERSION"\) !== window\.__PAGE_BUILD/.test(HTML), 'the boot check does not catch a stale config.js');
});
console.log(failures ? `\n${failures} FAILING` : '\nall passing');
process.exit(failures ? 1 : 0);
