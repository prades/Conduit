// Stamps a new build (the owner, 2026-11-10: "make edits smoother"): `node tools/stamp.js 2026-11-10b`
// A build is named in three files, and only these places change:
//   game.html     every ?v=<build> after a file name (each script's and preload's cache-buster) and window.__PAGE_BUILD
//   js/config.js  const BUILD_VERSION
//   bible.html    the BUILD_VERSION number and the footer's "written against build <build> (<day> <Month> <year>)"
// It refuses a name that is not a date and letters, and the build already stamped. Anything else that still names the old build (a comment, say) is listed, not changed:
// a find-and-replace over the whole page used to rewrite such comments too, so they named the wrong build.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8'), wr = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fail = m => { console.error('stamp: ' + m); process.exit(1); };

const next = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}[a-z]+$/.test(next || '')) { console.error('usage: node tools/stamp.js <yyyy-mm-dd><letters>, e.g. 2026-11-10b'); process.exit(2); }
const cfg = rd('js/config.js'), cm = cfg.match(/^const BUILD_VERSION = "([^"]+)";/m);
if (!cm) fail('js/config.js has no `const BUILD_VERSION = "...";` line');
const old = cm[1];
if (old === next) fail('the build is already ' + next);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const [y, mo, d] = next.slice(0, 10).split('-').map(Number);
if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) fail('not a date: ' + next.slice(0, 10));
const when = d + ' ' + MONTHS[mo - 1] + ' ' + y;

// game.html: the cache-busters and the page's own build
let g = rd('game.html');
const tagRe = new RegExp('\\?v=' + esc(old) + '(?=["\'&#])', 'g'), tags = (g.match(tagRe) || []).length;
if (!tags) fail('game.html has no ?v=' + old);
g = g.replace(tagRe, '?v=' + next);
const pbRe = new RegExp('(window\\.__PAGE_BUILD = ")' + esc(old) + '(";)');
if (!pbRe.test(g)) fail('game.html has no window.__PAGE_BUILD = "' + old + '";');
g = g.replace(pbRe, '$1' + next + '$2');

// bible.html: its BUILD_VERSION number and the footer
let b = rd('bible.html');
const bvOld = '<span class="n" data-k="BUILD_VERSION">' + old + '</span>';
if (b.indexOf(bvOld) < 0) fail('bible.html has no BUILD_VERSION number reading ' + old);
b = b.split(bvOld).join('<span class="n" data-k="BUILD_VERSION">' + next + '</span>');
const footRe = new RegExp('written against build ' + esc(old) + ' \\([^)]*\\)');
if (!footRe.test(b)) fail('bible.html\'s footer does not say "written against build ' + old + ' (…)"');
b = b.replace(footRe, 'written against build ' + next + ' (' + when + ')');

wr('game.html', g); wr('js/config.js', cfg.replace(cm[0], 'const BUILD_VERSION = "' + next + '";')); wr('bible.html', b);
console.log('stamped ' + next + ' (was ' + old + '): game.html ' + tags + ' cache-busters and __PAGE_BUILD, js/config.js BUILD_VERSION, bible.html its number and footer (' + when + ')');

// what still names the old build in the page or config: listed for a person to look at, not changed (the Bible's prose names past builds on purpose: "since build …")
const left = [];
for (const f of ['game.html', 'js/config.js']) rd(f).split('\n').forEach((line, i) => { if (line.indexOf(old) >= 0) left.push('  ' + f + ':' + (i + 1) + '  ' + line.trim().slice(0, 140)); });
if (left.length) console.log('still naming ' + old + ' (not changed):\n' + left.join('\n'));
