// THE REPORTED CASE: the deployed game showed "ASYNC CRASH — Can't find
// variable: followerPermHPBonus" from spawnFollowerFromSave, and every one of
// the twenty suites was green.
//
// Three things had to be true for that to happen.
//
// First, removing the shop deleted the five perm-bonus declarations but left
// the reads behind in six files. `(followerPermHPBonus||0)` reads as defensive,
// but `||` only guards a value that is undefined — an identifier that was never
// declared throws ReferenceError before the `||` is ever reached.
//
// Second, the crash lived in an async continuation: the strip game's
// loadConfig() awaited fetch, and the load-order suite evaluated the files
// synchronously and never saw it. (js/init.js is synchronous now and fetches
// nothing: it boots the facility as the scripts load, so the restore from the
// save happens before init.js finishes evaluating.)
//
// Third — and this one nearly defeated the test as well as the game — whether
// it crashes depends on saved state. An assignment to an undeclared name in
// sloppy mode creates the global, so a player whose storage held the right key
// silently got the variables created for them and never crashed; a player
// without it crashed. The first draft of this suite seeded the key and
// therefore passed with the bug fully present.
//
// So every scenario below boots twice: once with a clean store (a new player)
// and once with the facility's save in it (a returning player whose followers
// have to be rebuilt from "conduit_fp_save", js/facilitysave.js). Pass A
// installs a recorder on the global's prototype, which makes an undeclared read
// yield undefined instead of throwing — so one run names every undeclared
// global the boot touches instead of stopping at the first. Pass B boots a
// vanilla context and watches for the unhandled rejection, which is the crash
// the screenshot showed. Pass C plays: creatures, a fight, the facility's save.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }

const ORDER = scriptOrder();

// Optional browser APIs the game probes for and does not declare. Anything
// added here is a claim that the host provides it, not the game — keep it
// short, and never add a game variable to it. (CanvasRenderingContext2D: the
// facility dims its props through a second context, when the frame's context
// is a real one; Storage: it filters what reaches localStorage; HTMLImageElement: the start waits for sheets only when they are real images.)
const HOST_PROVIDED = new Set([
    'innerWidth', 'innerHeight',
    'webkitAudioContext', 'mozRequestAnimationFrame', 'webkitRequestAnimationFrame',
    'DeviceOrientationEvent', 'ontouchstart', 'chrome', 'opr', 'safari',
    'CanvasRenderingContext2D', 'Storage',
    'HTMLImageElement',   // (the start lists the sheets only when the page has real images to wait for: js/init.js startupAsset; the sandbox has none)
]);

// The facility's save, with a squad in it: the state that crashed is a
// returning player whose followers have to be rebuilt from localStorage. The
// second entry is bare: the fallback path, which is where the crashing
// expression lived.
const SAVE_KEY = 'conduit_fp_save';
function savedStore() {
    return {
        [SAVE_KEY]: JSON.stringify({
            v: 1,
            followers: [
                { element: 'fire', personality: 'stoic', role: 'brawler',
                  stats: { hp: 22, attack: 6, speed: 11, will: 20 } },
                { element: 'electric' },
            ],
        }),
        other_site_key: 'kept',   // a key that is not the facility's: left alone
    };
}

const SCENARIOS = [
    { label: 'a browser with no save (a new player)',            saved: false },
    { label: 'a browser holding the facility\'s save (a returning player)', saved: true  },
];
const storeFor = sc => sc.saved ? savedStore() : { other_site_key: 'kept' };

function installRecorder(sandbox, ctx) {
    const seen = new Map();   // name -> stack at the first read
    sandbox.__recordUndeclared = (k, stack) => { if (!seen.has(k)) seen.set(k, stack); };
    // The recorder has to sit on the global's PROTOTYPE, not be the global
    // itself: a contextified Proxy global does not get its traps consulted for
    // bare identifier resolution, but a Proxy in the prototype position does.
    // `get` is the trap that fires there, not `has`.
    vm.runInContext(`
        const _undeclaredGuard = new Proxy(Object.create(null), {
            get(t, k) {
                if (typeof k === 'string') __recordUndeclared(k, (new Error()).stack || '');
                return undefined;
            },
        });
        Object.setPrototypeOf(globalThis, _undeclaredGuard);
    `, ctx);
    return seen;
}

// ─────────────────────────────────────────────────────────
//  PASS A — name every global the game reads and never declares
// ─────────────────────────────────────────────────────────
async function passA(sc) {
    const store = storeFor(sc);
    const sandbox = makeBrowserSandbox(store);
    const ctx = vm.createContext(sandbox);
    const seen = installRecorder(sandbox, ctx);

    const loadErrors = [];
    for (const rel of ORDER) {
        try {
            vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
        } catch (e) {
            loadErrors.push(rel + ' — ' + e.message.split('\n')[0]);
        }
    }
    // The boot is synchronous now, but anything a file left on a microtask
    // still has to run before the offenders are read off.
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));

    const offenders = [...seen.keys()].filter(k => !HOST_PROVIDED.has(k)).sort();
    return { seen, offenders, loadErrors, ctx, store };
}

// ─────────────────────────────────────────────────────────
//  PASS B — the crash, end to end
// ─────────────────────────────────────────────────────────
// No recorder this time. An undeclared read throws for real, as it did in the
// browser.
async function passB(sc) {
    const store = storeFor(sc);
    const sandbox = makeBrowserSandbox(store);
    const ctx = vm.createContext(sandbox);

    const rejections = [];
    const onRejection = r => rejections.push(r);
    process.on('unhandledRejection', onRejection);

    const thrown = [];
    for (const rel of ORDER) {
        try {
            vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
        } catch (e) { thrown.push(rel + ' — ' + e.message.split('\n')[0]); }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    process.removeListener('unhandledRejection', onRejection);

    // config.js declares game state with `let`, which in a vm is script-scoped
    // rather than an own property of the global, so it has to be read by
    // evaluating the name.
    return { rejections, thrown, store, read: e => vm.runInContext(e, ctx) };
}

// ─────────────────────────────────────────────────────────
//  PASS C — the gameplay paths the boot never reaches
// ─────────────────────────────────────────────────────────
// Two of the six crashing reads were on the boot path; the other four were in
// code that only runs while playing — so a boot-only check would have shipped
// four of them. This pass plays the facility under the same recorder: creatures
// come at the squad, the real frame runs a few hundred times, and the
// facility's own save is written. The reads the boot made are pass A's: only
// what is first read while PLAYING counts here.
async function passC() {
    const sandbox = makeBrowserSandbox({});
    const ctx = vm.createContext(sandbox);
    const seen = installRecorder(sandbox, ctx);

    for (const rel of ORDER) {
        try {
            vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
        } catch (e) { /* reported by pass A */ }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const atBoot = new Set(seen.keys()); seen.clear();

    let drove = null, threw = null;
    try {
        drove = vm.runInContext(`(function(){
            const did = [];
            if (!facilityPlay) throw new Error('the page did not boot the facility');
            gameState.running = true; facilityBlackoutSet(false);
            canvas.width = 1280; canvas.height = 860;
            const squad = followers.filter(f => !f.dead);
            // Three creatures of three kinds, hunting, right beside the squad: the fight starts at once.
            const made = [];
            [['ant', 'scout'], ['spider', 'striker'], ['beetle', 'tank']].forEach(([species, className], i) => {
                const p = spawnCreature({ species, className, x: player.x + 2 + i, y: player.y + 1, level: 3, state: 'hunt' });
                if (!p) throw new Error('no ' + species + ' ' + className + ' was made');
                p.provoked = true; made.push(p);
            });
            did.push('creatures');
            for (let f = 0; f < 300; f++) render();
            did.push('frames');
            const hurt = made.filter(p => p.dead || p.health < p.maxHealth).length;
            const fought = squad.filter(f => f._nearestEnemy || f.dead || f.health < f.maxHealth).length;
            // Persistence is part of the gameplay path: it runs on a timer in
            // the real game, so nothing else here would exercise it.
            const wrote = facilitySaveWrite();
            did.push('saved');
            return { did, squad: squad.length, creatures: made.length, hurt, fought, frames: frame, wrote };
        })()`, ctx);
    } catch (e) { threw = e; }

    for (let i = 0; i < 10; i++) await new Promise(r => setImmediate(r));
    const offenders = [...seen.keys()].filter(k => !HOST_PROVIDED.has(k) && !atBoot.has(k)).sort();
    return { seen, offenders, drove, threw, store: sandbox.localStorage,
             wroteSave: sandbox.localStorage.getItem(SAVE_KEY) };
}

const DEAD_NAMES = ['followerPermHPBonus', 'followerPermPowerBonus',
                    'pylonMaxHPBonus', 'pylonRangeBonus', 'pylonFireRateBonus',
                    'permUpgrades'];

(async () => {
    for (const sc of SCENARIOS) {
        const A = await passA(sc);
        const B = await passB(sc);

        group(sc.label);

        if (A.offenders.length) {
            console.log('  undeclared globals read during boot:');
            for (const k of A.offenders) {
                // Frame 1 is the recorder itself; the useful one is the first
                // frame that sits in a game file.
                const frame = (A.seen.get(k).split('\n')
                    .find(l => l.includes('js/')) || '').trim();
                console.log(`    ${k}${frame ? '   ' + frame : ''}`);
            }
        }

        check('THE SCREENSHOT: no unhandled rejection while booting and restoring followers', () => {
            const msgs = B.rejections.map(r => (r && r.message) || String(r));
            ok(msgs.length === 0, msgs.join(' | '));
        });

        check('the perm-bonus names are neither read nor conjured into being', () => {
            // Read via pass A, and separately confirmed absent from the live
            // context — an implicit global created by assignment would satisfy
            // the first check while leaving the codebase broken.
            const live = DEAD_NAMES.filter(n => A.seen.has(n));
            ok(live.length === 0, 'still read: ' + live.join(', '));
            const conjured = DEAD_NAMES.filter(n => B.read(`typeof ${n}`) !== 'undefined');
            ok(conjured.length === 0, 'created as implicit globals: ' + conjured.join(', '));
        });

        check('no undeclared global is read during boot at all', () => {
            ok(A.offenders.length === 0,
               A.offenders.length + ' undeclared: ' + A.offenders.join(', '));
        });

        check('no file fails to evaluate', () => {
            ok(A.loadErrors.length === 0, A.loadErrors.join(' | '));
            ok(B.thrown.length === 0, B.thrown.join(' | '));
        });

        check('the page booted the facility as the scripts loaded', () => {
            ok(B.read('typeof facilityPlay !== "undefined" && facilityPlay === true'), 'facilityPlay is not true after the files are evaluated');
            ok(B.read('typeof _fp !== "undefined" && !!_fp && !!_fp.F'), 'the facility was not built');
        });

        check(sc.saved ? 'the saved squad is actually on the map' : 'a new player starts with the three followers', () => {
            // Proves the boot reached spawnFollowerFromSave (or the starters)
            // rather than passing because it bailed out early.
            const f = B.read('followers');
            ok(Array.isArray(f), 'followers is not an array');
            const want = sc.saved ? 2 : 3;
            ok(f.length === want, 'expected ' + want + ' followers, got ' + f.length);
            ok(f.every(n => n.health > 0), 'a follower has no health');
            if (sc.saved) ok(f.some(n => n.element === 'fire' && n.personality === 'stoic' && n.role === 'brawler'), 'the saved brawler did not come back as saved');
            else ok(['electric', 'core', 'fire'].every(el => f.some(n => n.element === el)), 'the starters are not electric, core and fire: ' + f.map(n => n.element));
        });

        if (sc.saved) check('a follower with no saved stats still restores', () => {
            // The second save entry is bare `{element:'electric'}` — the
            // fallback path, which is where the crashing expression lived.
            const bare = B.read('followers').find(n => n.element === 'electric');
            ok(!!bare, 'the bare entry did not restore');
            ok(bare.health > 0 && bare.power > 0, 'fallback stats did not apply');
            ok(bare.personality && bare.stats, 'it was given no personality or stats');
        });

        check('the boot leaves the store as it found it: nothing of another site is touched, and no strip-game key is written', () => {
            ok(B.store.other_site_key === 'kept', 'a key that is not the facility\'s was changed');
            const strip = Object.keys(B.store).filter(k => /^tubecrawler_/.test(k));
            ok(strip.length === 0, 'the boot wrote a strip-game key: ' + strip.join(', '));
            if (sc.saved) ok(SAVE_KEY in B.store, 'the boot threw the facility\'s save away');
        });
    }

    group('the recorder is worth trusting');
    const A = await passA(SCENARIOS[0]);

    check('it records a read it has never seen', () => {
        const before = A.seen.size;
        vm.runInContext('(function(){ return __probeNeverDeclared; })()', A.ctx);
        ok(A.seen.has('__probeNeverDeclared'), 'a known-undeclared read was not recorded');
        ok(A.seen.size === before + 1, 'recorded something unexpected as well');
    });

    check('it does NOT report a declared-but-unset global', () => {
        // `let x;` is a real declaration. Reading it is legal and must not
        // count, or the suite would drown in false positives.
        vm.runInContext('let _declaredUnset; (function(){ return _declaredUnset; })()', A.ctx);
        ok(!A.seen.has('_declaredUnset'), 'a declared global was reported as undeclared');
    });

    check('it survives the game having already installed its own prototype', () => {
        // Sanity: the guard is still in place after every file has loaded, so
        // the readings above cover the whole boot and not just the first file.
        ok(vm.runInContext('Object.getPrototypeOf(globalThis) !== null', A.ctx),
           'the guard was knocked off the prototype chain during load');
    });

    group('fighting and saving does not read a dead global either');
    const C = await passC();

    if (C.offenders.length) {
        console.log('  undeclared globals first read during play:');
        for (const k of C.offenders) {
            const frame = (C.seen.get(k).split('\n').find(l => l.includes('js/')) || '').trim();
            console.log(`    ${k}${frame ? '   ' + frame : ''}`);
        }
    }

    check('the drive actually got through: creatures came, the squad fought them for 300 frames, the save was written', () => {
        // Without this the pass could report a clean bill of health because it
        // silently did nothing.
        ok(!C.threw, 'driving threw: ' + (C.threw && C.threw.message || ''));
        ok(C.drove, 'the drive returned nothing');
        for (const step of ['creatures', 'frames', 'saved']) ok(C.drove.did.includes(step), 'never reached ' + step);
        ok(C.drove.squad === 3 && C.drove.creatures === 3, 'not a squad of three against three creatures');
        ok(C.drove.frames >= 300, 'only advanced ' + C.drove.frames + ' frames');
        ok(C.drove.fought > 0, 'no follower ever engaged a creature');
        ok(C.drove.hurt > 0, 'no creature was ever hit');
    });

    check('no undeclared global is read while playing', () => {
        ok(C.offenders.length === 0,
           C.offenders.length + ' undeclared: ' + C.offenders.join(', '));
    });

    check('the perm-bonus names are not read on the gameplay paths', () => {
        const live = DEAD_NAMES.filter(n => C.seen.has(n));
        ok(live.length === 0, 'still read: ' + live.join(', '));
    });

    check('the facility\'s save actually writes — it swallows its own errors', () => {
        // facilitySaveWrite's body sits in try {} catch(e) { return false; }, so
        // ANY throw inside it — a global it reads that nobody declared, say —
        // silently disables every bit of persistence with no symptom at all.
        ok(!C.threw, 'the drive threw: ' + (C.threw && C.threw.message || ''));
        ok(C.drove.wrote === true, 'facilitySaveWrite answered ' + (C.drove && C.drove.wrote));
        ok(C.wroteSave, 'the save was not written after a drive');
        const blob = JSON.parse(C.wroteSave);
        for (const key of ['v', 'followers', 'relays', 'inv', 'crystal', 'at']) {
            ok(key in blob, 'the save is missing ' + key);
        }
        ok(blob.v === 1 && Array.isArray(blob.followers) && blob.followers.length === 3, 'the save does not hold the squad');
        const strip = Object.keys(C.store).filter(k => /^tubecrawler_/.test(k));
        ok(strip.length === 0, 'playing wrote a strip-game key: ' + strip.join(', '));
    });

    group('nothing re-grows the shop');

    check('no file defines the perm-upgrade store', () => {
        const hits = [];
        for (const rel of ORDER) {
            const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
            if (/function (save|load)PermUpgrades/.test(src)) hits.push(rel);
        }
        ok(hits.length === 0, 'savePermUpgrades/loadPermUpgrades are back in ' + hits.join(', '));
    });

    check('no file mentions the perm-bonus names', () => {
        // The belt to pass A's braces: a read on a path the boot does not take
        // would not be recorded, but it is still a crash waiting for a player.
        const hits = [];
        for (const rel of ORDER) {
            const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
            for (const n of DEAD_NAMES) {
                if (new RegExp('\\b' + n + '\\b').test(src)) hits.push(`${rel}:${n}`);
            }
        }
        ok(hits.length === 0, hits.join(', '));
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
