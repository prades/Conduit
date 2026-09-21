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
// Second, the crash lives in an async continuation. loadConfig() awaits fetch,
// so everything after that runs on a microtask, and the existing load-order
// suite evaluates the files synchronously and never sees it.
//
// Third — and this one nearly defeated the test as well as the game — whether
// it crashes depends on saved state. init.js used to ASSIGN those names from
// the saved perm-upgrade blob, and an assignment to an undeclared name in
// sloppy mode creates the global. So a player still holding the shop era's
// localStorage key silently got the variables created for them and never
// crashed; a player without that key crashed. The first draft of this suite
// seeded the key and therefore passed with the bug fully present.
//
// So every scenario below boots twice: once with the shop-era key, once
// without. Pass A installs a recorder on the global's prototype, which makes an
// undeclared read yield undefined instead of throwing — so one run names every
// undeclared global the boot touches instead of stopping at the first. Pass B
// boots a vanilla context and watches for the unhandled rejection, which is the
// crash the screenshot showed.
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
// short, and never add a game variable to it.
const HOST_PROVIDED = new Set([
    'innerWidth', 'innerHeight',
    'webkitAudioContext', 'mozRequestAnimationFrame', 'webkitRequestAnimationFrame',
    'DeviceOrientationEvent', 'ontouchstart', 'chrome', 'opr', 'safari',
]);

// A save with a squad in it: the state that crashed is a returning player whose
// followers have to be rebuilt from localStorage.
//
// `shopEra` decides whether this browser still holds the dead perm-upgrade key.
// Both answers are real players, and they used to behave differently, so both
// are tested.
function seededStore(shopEra) {
    const store = {
        tubecrawler_followers: JSON.stringify([
            { element: 'fire', personality: 'stoic', role: 'brawler',
              stats: { hp: 22, attack: 6, speed: 11, will: 20 } },
            { element: 'electric' },
        ]),
        tubecrawler_shards: '120',
    };
    if (shopEra) {
        store.tubecrawler_permupgrades = JSON.stringify({
            ids: ['overclock'], pylonMaxHPBonus: 40, pylonRangeBonus: 1,
            pylonFireRateBonus: 15, followerPermPowerBonus: 5, followerPermHPBonus: 25,
        });
    }
    return store;
}

const SCENARIOS = [
    { label: 'a browser with no shop-era save (the reported crash)', shopEra: false },
    { label: 'a browser still holding the shop-era save',            shopEra: true  },
];

// ─────────────────────────────────────────────────────────
//  PASS A — name every global the game reads and never declares
// ─────────────────────────────────────────────────────────
async function passA(shopEra) {
    const store = seededStore(shopEra);
    const sandbox = makeBrowserSandbox(store);
    const ctx = vm.createContext(sandbox);

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

    const loadErrors = [];
    for (const rel of ORDER) {
        try {
            vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
        } catch (e) {
            loadErrors.push(rel + ' — ' + e.message.split('\n')[0]);
        }
    }
    // The boot is not finished when the last file finishes evaluating: init.js
    // calls loadConfig(), which awaits fetch, so the follower restore happens
    // on a microtask. Snapshotting the offenders here — as the first draft did —
    // measured only the synchronous part and missed every read on the async
    // path, which is exactly where the reported crash was.
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));

    const offenders = [...seen.keys()].filter(k => !HOST_PROVIDED.has(k)).sort();
    return { seen, offenders, loadErrors, ctx, store };
}

// ─────────────────────────────────────────────────────────
//  PASS B — the crash, end to end
// ─────────────────────────────────────────────────────────
// No recorder this time. An undeclared read throws for real, inside the async
// continuation of loadConfig, exactly as it did in the browser.
async function passB(shopEra) {
    const store = seededStore(shopEra);
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
    // init.js calls loadConfig() as it loads, and it awaits fetch twice. Let the
    // microtasks drain so the continuation — and its crash — actually happens.
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
// Two of the six crashing reads were on the boot path. The other four were in
// _executeBuild, _executeBuildInstant, _executeUpgrade and the attack-pylon
// fire tick, none of which run while the page is loading — so a boot-only
// check would have shipped four of them. This pass builds pylons, upgrades one
// and runs the real render loop, under the same recorder.
async function passC() {
    const sandbox = makeBrowserSandbox({ tubecrawler_shards: '5000' });
    const ctx = vm.createContext(sandbox);

    const seen = new Map();
    sandbox.__recordUndeclared = (k, stack) => { if (!seen.has(k)) seen.set(k, stack); };
    vm.runInContext(`
        Object.setPrototypeOf(globalThis, new Proxy(Object.create(null), {
            get(t, k) {
                if (typeof k === 'string') __recordUndeclared(k, (new Error()).stack || '');
                return undefined;
            },
        }));
    `, ctx);

    for (const rel of ORDER) {
        try {
            vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
        } catch (e) { /* reported by pass A */ }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));

    let drove = null, threw = null;
    try {
        drove = vm.runInContext(`(function(){
            gameState.running = true;
            shardCount = 5000;
            const floor = world.filter(t => !t.pillar && !t.nest && t.y >= 0 && t.y <= 3);
            const fire  = ELEMENTS.find(e => e.id === 'fire');
            const did   = [];
            if (floor[8])  { _executeBuildInstant(fire, floor[8]);  did.push('buildInstant'); }
            if (floor[20]) { _executeBuild(fire, floor[20]);        did.push('build'); }
            const plain = world.find(t => t.pillar && t.pillarTeam === 'green'
                                          && !t.attackMode && !t.waveMode);
            if (plain) { _executeUpgrade(fire, plain); did.push('upgrade'); }
            _cacheAge = -999;
            // Long enough for the attack-pylon fire tick, which only runs every
            // 90 frames, to come round several times.
            for (let f = 0; f < 240; f++) render();
            did.push('frames');
            return { did, aPylons: _aPylons.length, frames: frame };
        })()`, ctx);
    } catch (e) { threw = e; }

    for (let i = 0; i < 10; i++) await new Promise(r => setImmediate(r));
    const offenders = [...seen.keys()].filter(k => !HOST_PROVIDED.has(k)).sort();
    return { seen, offenders, drove, threw };
}

const DEAD_NAMES = ['followerPermHPBonus', 'followerPermPowerBonus',
                    'pylonMaxHPBonus', 'pylonRangeBonus', 'pylonFireRateBonus',
                    'permUpgrades'];

(async () => {
    for (const sc of SCENARIOS) {
        const A = await passA(sc.shopEra);
        const B = await passB(sc.shopEra);

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

        check('THE SCREENSHOT: no unhandled rejection while restoring followers', () => {
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

        check('the saved squad is actually on the map', () => {
            // Proves the boot reached spawnFollowerFromSave rather than passing
            // because it bailed out early.
            const f = B.read('followers');
            ok(Array.isArray(f), 'followers is not an array');
            ok(f.length === 2, 'expected the 2 saved followers, got ' + f.length);
            ok(f.every(n => n.health > 0), 'a restored follower has no health');
        });

        check('a follower with no saved stats still restores', () => {
            // The second save entry is bare `{element:'electric'}` — the
            // fallback path, which is where the crashing expression lived.
            const bare = B.read('followers').find(n => n.element === 'electric');
            ok(!!bare, 'the bare entry did not restore');
            ok(bare.health > 0 && bare.power > 0, 'fallback stats did not apply');
        });

        check('the dead perm-upgrade key is not left in storage', () => {
            ok(!('tubecrawler_permupgrades' in B.store),
               'the dead perm-upgrade key survived the boot');
        });

        check('the purge is surgical', () => {
            // Shards are still a live currency, and the squad still has to come
            // back. Clearing more than the one dead key would be a data loss.
            ok(B.store.tubecrawler_shards === '120', 'the purge ate the shard count');
            ok('tubecrawler_followers' in B.store, 'the purge ate the follower save');
        });
    }

    group('the recorder is worth trusting');
    const A = await passA(false);

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

    group('building and fighting does not read a dead global either');
    const C = await passC();

    if (C.offenders.length) {
        console.log('  undeclared globals read during play:');
        for (const k of C.offenders) {
            const frame = (C.seen.get(k).split('\n').find(l => l.includes('js/')) || '').trim();
            console.log(`    ${k}${frame ? '   ' + frame : ''}`);
        }
    }

    check('the drive actually got through all four paths', () => {
        // Without this the pass could report a clean bill of health because it
        // silently did nothing.
        ok(!C.threw, 'driving threw: ' + (C.threw && C.threw.message || ''));
        ok(C.drove, 'the drive returned nothing');
        for (const step of ['buildInstant', 'build', 'upgrade', 'frames']) {
            ok(C.drove.did.includes(step), 'never reached ' + step);
        }
        ok(C.drove.aPylons > 0, 'no attack pylon existed, so the fire tick never ran');
        ok(C.drove.frames >= 240, 'only advanced ' + C.drove.frames + ' frames');
    });

    check('no undeclared global is read while playing', () => {
        ok(C.offenders.length === 0,
           C.offenders.length + ' undeclared: ' + C.offenders.join(', '));
    });

    check('the perm-bonus names are not read on the gameplay paths', () => {
        const live = DEAD_NAMES.filter(n => C.seen.has(n));
        ok(live.length === 0, 'still read: ' + live.join(', '));
    });

    group('nothing re-grows the shop');

    check('no file defines the perm-upgrade store', () => {
        const save = fs.readFileSync(path.join(ROOT, 'js/save.js'), 'utf8');
        ok(!/function (save|load)PermUpgrades/.test(save),
           'savePermUpgrades/loadPermUpgrades are back');
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
