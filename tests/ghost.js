// GHOST-STEP EQUIVALENCE (tests/ghost.js): a step with no picture must leave the game exactly where a drawn step would.
// js/game.js gameLoop runs several steps per refresh on a slow device: all but the last are "ghost" steps (_simStep(false): ctx is the null context, _simGhost is true). In FACILITY PLAY a ghost step
// builds a smaller (or empty) draw list. Everything that lives in the draw pass and that logic reads must still happen in it. This runs two copies of the same facility, in lock step, from the same seed:
//   A  every step is a normal render() (one picture each)                 [or, in LOOP mode, gameLoop at 60 Hz: one drawn step a refresh]
//   X  every step is _simStep(false), no picture at all                   [or, in LOOP mode, gameLoop at 15 Hz: three ghost steps and a drawn one a refresh]
// and compares the game's state: a cheap digest every step (the first step it differs), and a deep snapshot of every module-level variable every EVERY steps.
//   node tests/ghost.js            (STEPS=600 EVERY=30 SCENARIO=tutorial|lit|attract MODE=direct|loop CONDUIT_ROOT=<a copy of the repo> GHOST_SELFTEST=1 VERBOSE=1 STRICT_CACHES=1)
// Exit 0 = equivalent (apart from the allow-listed drawing state below); 1 = some state differs.
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = process.env.CONDUIT_ROOT ? path.resolve(process.env.CONDUIT_ROOT) : path.resolve(__dirname, '..');
const { scriptOrder, makeBrowserSandbox } = require(path.join(ROOT, 'tests', 'domstub.js'));
process.on('unhandledRejection', () => {});

const STEPS = +process.env.STEPS || 600;            // game steps per run (a multiple of 4: LOOP mode compares after every refresh of four)
const EVERY = +process.env.EVERY || 30;            // a deep snapshot every this many steps (a multiple of 4)
const SEED = +process.env.SEED || 20240607;
const VERBOSE = !!process.env.VERBOSE;
const W = 1180, H = 820;                            // an iPad-sized screen: the canvas size decides what is culled, so it is pinned

// ── what may legitimately differ between a drawn step and a step with no picture ──
// (1) the clock's and the readout's own counters, and the pen; (2) values that only DRAWING reads. Anything else that differs is a failure.
// Keep this list short and give every entry a reader check (Grep for the name) before adding it.
const IGNORE = /^(_virusesOnScreen|_virusesCounting|_virusCountFrame|_perf|_simLast|_simDebt|_simStepsShown|_simStepsCount|_simStepsAt|_simGhost|_nullCtx|_lastDrawScan|_fpCam|_fpBase|_fpDimW|_fpDimFor|ctx|canvas)(\W|$)/;
// DRAW-ONLY caches that a step with no picture rightly does not fill (each checked with Grep: only the drawing code reads it): the cable layer's timer (_cableLaidAt, js/game.js layAllCablesCached), the tile column index (_colIndex*, built
// lazily from `world` by tileColumns for the draw list), the rooms' colour cache (_fpRoomCol), the baked floor sprites (_fp.spr), a wall's bounds cache and the draw-depth cache (_fp.items[].bb and ._dd, _fpWallOnScreen and the sort).
// `world` itself is followed through worldTileMap and the actors; as a root it is only the same array under another name.
const IGNORE_PATH = /^(_cableLaidAt|_cableSig|_cableTiles|_cableBeadWires|_beadCells|_cableRoutes|_cableStyles|_colIndex\w*|_fpRoomCol|_fp\.spr|_fp\.doorMids\w*|_fp\.items\[\]\.(bb|_dd)|world)([\W]|$)/;
// a root that looks like a cache of sprites/measurements: reported separately; it fails the run only with STRICT_CACHES=1 (verify with Grep that only drawing reads it, then add it to IGNORE)
const CACHEY = /(sprite|cache|atlas|slice|sils|pattern|_img|dim|glyph|memo|tilemap|columns)/i;

// ── a determinate Math.random ──
// The draw pass spends random numbers (sparks, flicker, the player's idle). A single stream would hand the logic after it different numbers when a step draws less, and the two runs would drift apart
// for no real reason. So every CALL SITE (the three innermost frames) has its own stream, derived from the seed and a counter: a call the ghost step skips cannot disturb a call it keeps.
let ACTIVE = null;                                  // the run whose step is executing (steps are synchronous, the two runs never interleave inside one)
const hostRandom = Math.random;
function fnv(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mix(a, b) { let t = (a ^ Math.imul(b + 0x9E3779B9, 0x85EBCA6B)) >>> 0; t = Math.imul(t ^ (t >>> 15), 0xC2B2AE35); t = Math.imul(t ^ (t >>> 13), 0x27D4EB2F); return ((t ^ (t >>> 16)) >>> 0) / 4294967296; }
function siteRandom() {
    const r = ACTIVE; if (!r) return hostRandom();
    const o = {}, lim = Error.stackTraceLimit; Error.stackTraceLimit = 10; Error.captureStackTrace(o); Error.stackTraceLimit = lim;
    // the first three frames of the GAME's own code: the way in (render() called directly, or by _simStep, or by gameLoop; the test's own eval) is not part of the site
    const frames = String(o.stack).split('\n').slice(2).map(s => s.replace(/^\s*at\s+/, '')).filter(s => !/^(_simStep|gameLoop)\b|evalmachine|node:|ghost\.js|^eval\b|^Script\b|^Array\.forEach/.test(s)).slice(0, 3);
    const key = frames.map(s => s.replace(/\(.*[\\/]/, '(').replace(/^.*[\\/]/, '')).join('<');
    let s = r.sites.get(key); if (!s) { s = { h: fnv(key) ^ r.seed, n: 0 }; r.sites.set(key, s); }
    return mix(s.h, s.n++);
}

// ── a browser, with a 2D context that has a prototype (the null context is built from it) ──
const SETTINGS = ['fillStyle', 'strokeStyle', 'lineWidth', 'globalAlpha', 'font', 'textAlign', 'textBaseline', 'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'lineCap', 'lineJoin', 'miterLimit', 'globalCompositeOperation', 'imageSmoothingEnabled', 'lineDashOffset', 'filter'];
const METHODS = ['fill', 'stroke', 'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'fillText', 'strokeText', 'save', 'restore', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'arc', 'arcTo', 'ellipse', 'quadraticCurveTo', 'bezierCurveTo', 'translate', 'rotate', 'scale', 'setTransform', 'resetTransform', 'transform', 'clip', 'rect', 'roundRect', 'setLineDash', 'putImageData', 'createRadialGradient', 'createLinearGradient', 'createConicGradient', 'createPattern', 'measureText', 'getLineDash', 'isPointInPath', 'getImageData', 'createImageData'];
const PAINT = new Set(['fill', 'stroke', 'drawImage', 'fillRect', 'strokeRect', 'fillText', 'strokeText']);
function makeDrawnCtx(canvas) {
    function Ctx2D() { this._v = Object.create(null); this.paints = 0; }
    for (const k of SETTINGS) Object.defineProperty(Ctx2D.prototype, k, { configurable: true, enumerable: true, get() { return this._v[k]; }, set(v) { this._v[k] = v; } });
    const grad = () => ({ addColorStop() {} });
    for (const k of METHODS) Ctx2D.prototype[k] = function (a) {
        if (PAINT.has(k)) this.paints++;
        if (k === 'createRadialGradient' || k === 'createLinearGradient' || k === 'createConicGradient') return grad();
        if (k === 'measureText') return { width: String(a).length * 6 };
        if (k === 'getLineDash') return [];
        if (k === 'isPointInPath') return false;
        if (k === 'createImageData' || k === 'getImageData') return { data: new Uint8ClampedArray(4 * 96 * 96), width: 96, height: 96 };
        return undefined;
    };
    const noop = function () {};
    // (a method this stub lacks does nothing, never a crash: the catch-all sits behind the prototype, so the methods that exist stay plain and fast)
    Object.setPrototypeOf(Ctx2D.prototype, new Proxy({}, { get: (t, k) => (typeof k === 'symbol' ? undefined : noop) }));
    const real = new Ctx2D(); real.canvas = canvas; const pen = real;
    return { Ctx2D, pen, real };
}

// ── the deep snapshot (runs INSIDE the game's context) ──
// Walks the named module-level variables. Records every primitive at its path; Maps, Sets, arrays and class instances are followed (with caps), functions and DOM-like things are not; a reference met twice is
// written as "@ref <first path>". Numbers are recorded exactly: the two runs do the same arithmetic, so they match to the bit or they have diverged.
function snapshotRoots(names, caps) {
    const out = Object.create(null), seen = new WeakMap(); let nodes = 0;
    const put = (p, v) => { out[p] = v; };
    const domLike = v => { try { return typeof v.getContext === 'function' || typeof v.appendChild === 'function' || (typeof v.naturalWidth === 'number' && 'complete' in v) || (v.nodeType !== undefined) || v === ctx || v === canvas; } catch (e) { return false; } };
    function walk(p, v, d) {
        if (v === null || v === undefined) return put(p, v === null ? 'null' : 'undef');
        const t = typeof v;
        if (t === 'number') return put(p, Number.isFinite(v) ? v : String(v));
        if (t === 'string') return put(p, v.length > 160 ? v.slice(0, 160) + '…' + v.length : v);
        if (t === 'boolean') return put(p, v);
        if (t === 'bigint') return put(p, String(v));
        if (t === 'function' || t === 'symbol') return;
        if (++nodes > caps.nodes) { if (nodes === caps.nodes + 1) put('…', 'TRUNCATED'); return; }
        if (seen.has(v)) return put(p, '@ref ' + seen.get(v));
        seen.set(v, p);
        if (domLike(v)) return put(p, '[dom]');
        if (d > caps.depth) return put(p, '[deep]');
        if (ArrayBuffer.isView(v)) { let s = 0; const n = Math.min(v.length, 4096); for (let i = 0; i < n; i++) s += v[i]; put(p + '#len', v.length); return put(p + '#sum', s); }
        if (v instanceof Map) { put(p + '#size', v.size); let i = 0; for (const [k, x] of v) { if (i++ >= caps.coll) { put(p + '#cut', true); break; } walk(p + '{' + (k !== null && typeof k === 'object' ? '@' + (i - 1) : String(k)) + '}', x, d + 1); } return; }
        if (v instanceof Set) { put(p + '#size', v.size); let i = 0; for (const x of v) { if (i++ >= caps.coll) { put(p + '#cut', true); break; } if (x !== null && typeof x === 'object') walk(p + '{@' + (i - 1) + '}', x, d + 1); else put(p + '{' + String(x) + '}', true); } return; }
        if (Array.isArray(v)) { put(p + '#len', v.length); const n = Math.min(v.length, caps.coll); for (let i = 0; i < n; i++) walk(p + '[' + i + ']', v[i], d + 1); if (v.length > n) put(p + '#cut', true); return; }
        let ctor = ''; try { ctor = v.constructor && v.constructor.name; } catch (e) {}
        if (ctor && ctor !== 'Object') put(p + '@ctor', ctor);
        let ks; try { ks = Object.keys(v); } catch (e) { return; }
        if (ks.length > caps.coll) { put(p + '#keys', ks.length); ks = ks.slice(0, caps.coll); }
        for (const k of ks) { let x; try { x = v[k]; } catch (e) { continue; } walk(p + '.' + k, x, d + 1); }
    }
    for (const n of names) { let v; try { v = (0, eval)(n); } catch (e) { try { v = eval(n); } catch (e2) { continue; } } walk(n, v, 0); }
    return out;
}
// a small digest of the state that matters most, cheap enough to take every step (the first step the runs differ)
function coreDigest() {
    const f = x => (typeof x === 'number' ? x : String(x));
    const a = actors.map(q => [q.x, q.y, q.health, q.state, q.dead ? 1 : 0, q.job ? (q.job.type || 1) : 0, q.team].map(f).join(','));
    const fo = followers.map(q => [q.x, q.y, q.health, q.state, q.dead ? 1 : 0, q.job ? (q.job.type || 1) : 0].map(f).join(','));
    const lights = _fp && _fp.light ? Array.from(_fp.light.values()).map(v => v.toFixed(6)).join(',') : '';
    const doors = _fp && _fp.doorItems ? Array.from(_fp.doorItems.values()).map(d => (d.st && d.st.open || 0).toFixed(4)).join(',') : '';
    return [frame, player.x, player.y, crystal.health, actors.length, followers.length, floatingTexts.length, elementEffects.length, turretShots.length, respawnQueue.length, typeof shardCount === 'number' ? shardCount : '', a.join(';'), fo.join(';'), lights].join('|') + '#' + doors;
}

// ── the module-level variables, found in the sources (not a hand-kept list: a new one is picked up by itself) ──
function splitDeclarators(s) {   // "a = 0, b = [1, 2], c" -> ["a", "b", "c"]
    const names = []; let depth = 0, q = null, start = 0;
    const take = seg => { const m = /^\s*([A-Za-z_$][\w$]*)\s*(=|$)/.exec(seg); if (m) names.push(m[1]); };
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
        if (c === '"' || c === "'" || c === '`') { q = c; continue; }
        if (c === '(' || c === '[' || c === '{') depth++; else if (c === ')' || c === ']' || c === '}') depth--;
        else if (c === ',' && depth === 0) { take(s.slice(start, i)); start = i + 1; }
        else if (c === ';' && depth === 0) { take(s.slice(start, i)); return names; }
        else if (c === '/' && s[i + 1] === '/' && depth === 0) { break; }
    }
    take(s.slice(start)); return names;
}
function discoverRoots(context) {
    const names = new Set();
    for (const rel of scriptOrder()) {
        const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        for (const line of src.split('\n')) {
            const m = /^(let|var|const)\s+(?![{\[])(.*)$/.exec(line); if (!m) continue;
            if (m[1] === 'const' && /^[A-Z][A-Z0-9_]*\s*=/.test(m[2])) continue;   // (a SHOUTING const is a constant table, not state; a SHOUTING let is kept)
            for (const n of splitDeclarators(m[2])) names.add(n);
        }
    }
    const live = [];
    for (const n of names) { let t; try { t = vm.runInContext('typeof ' + n, context); } catch (e) { continue; } if (t !== 'undefined' && t !== 'function') live.push(n); }
    return live.sort();
}

// ── one run: a fresh browser, a seeded facility, the same script of inputs ──
const PT_JS = `globalThis.__PT = (function () { const F = _fp.F, R = id => F.byId.get(id), mid = b => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], near = (x, y) => { const rx = Math.round(x), ry = Math.round(y); for (let r = 0; r < 6; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) if (facilityWalkable(rx + dx, ry + dy, F)) return [rx + dx, ry + dy]; return [rx, ry]; };
    const L = R('experiment_lab'), H = R('lab_hallway'), A = R('arena'), C = R('crystal_chamber'), ad = F.openings.find(o => o.id === 'door_arena_hallway');
    return { chamber: near(mid(C.bb)[0], mid(C.bb)[1] + 3), hallN: near(mid(L.bb)[0], (H.bb[1] + L.bb[1]) / 2), arena: near((ad.a[0] + ad.b[0]) / 2 + 8, ad.a[1] + 14), arenaDeep: near(mid(A.bb)[0], mid(A.bb)[1]), lab: near(mid(L.bb)[0] - 4, mid(L.bb)[1]) }; })();`;
// the scenarios: how the facility is opened, and what the "player" does, by step number (the same in both runs; every number is a multiple of 4 so a 15 fps refresh lands on it)
const WALK = k => `facilityWalkTo(__PT.${k}[0], __PT.${k}[1]);`;
// a squad of six, dropped beside the nearest creature in the arena; the player locks on and fires; a follower is killed (it goes on the respawn queue); the player walks out through the doors
const FIGHT_START = `(function(){ for (const el of ['ice', 'toxic', 'flux']) spawnFollowerAtCrystal(el); const t = actors.find(a => a.team === 'red' && !a.isNeutralRecruit && !a.dead); const c = _fpNearestCell(t.x - 4, t.y - 4);
    player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1]; player.fpPath = null; playerAmmo = Math.max(playerAmmo, 200);
    followers.forEach((f, i) => { f.x = c[0] + 0.4 * i; f.y = c[1] + 1; f.returningToCrystal = false; f.stance = 'follow'; f.job = null; }); })();`;
const FIGHT_SHOOT = `(function(){ playerAttackMode = true; const foes = actors.filter(a => a.team === 'red' && !a.isNeutralRecruit && !a.dead); if (!foes.length) return; foes.sort((p, q) => Math.hypot(p.x - player.x, p.y - player.y) - Math.hypot(q.x - player.x, q.y - player.y));
    gunLock(foes[0]); if (player.attackCooldown <= 0) firePlayerShot(foes[0]); })();`;
const SCENARIOS = {
    tutorial: { open: '', events: { 8: WALK('hallN'), 360: WALK('arena'), 560: WALK('chamber') } },                       // the opening blackout (power, lamps), then out through the doors
    lit: { open: 'facilityBlackoutSet(false);', events: { 4: FIGHT_START, 240: 'applyDamage(followers[0], 99999, null);', 320: WALK('hallN'), 460: WALK('chamber') }, every: [{ from: 8, period: 12, until: 320, code: FIGHT_SHOOT }] },
    attract: { open: '', attract: true, events: {} },                                                                 // the website's background (no player: searchers walk the halls)
};
async function bootRun(name, scn, mode, label) {
    const store = { tubecrawler_seed: '305419896', conduit_fp_gfx: 'high' };   // (the graphics level is pinned: the slow-device switch must not fire in one run and not the other)
    const sb = makeBrowserSandbox(store);
    const clock = { now: 1000 }; sb.performance = { now: () => clock.now };   // (not 0: gameLoop reads _simLast === 0 as 'no history' and owes only one step the first time)
    sb.innerWidth = W; sb.innerHeight = H;
    if (scn.attract) sb.location = { search: '?attract', href: 'http://localhost/game.html?attract', hash: '' };
    const run = { name, label, mode, clock, store, seed: SEED, sites: new Map(), ms: 0, paints: 0, nsteps: 0 };
    const context = vm.createContext(sb); run.context = context; run.sb = sb;
    run.eval = s => vm.runInContext(s, context);
    ACTIVE = run;
    for (const rel of scriptOrder()) { try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) { console.log('  (load ' + rel + ': ' + e.message + ')'); } }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const dc = makeDrawnCtx(run.eval('canvas')); sb.CanvasRenderingContext2D = dc.Ctx2D; sb.__pen = dc.pen; run.pen = dc.real;
    run.eval('CanvasRenderingContext2D === undefined || (ctx = __pen);');
    run.eval('canvas.width = ' + W + '; canvas.height = ' + H + '; gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id));');
    if (scn.attract) run.eval('attractRefresh();');
    run.eval('facilityPlayStart();');
    run.eval(scn.open || '');
    if (scn.attract) run.eval(`for (let i = 0; i < _at.forms.length; i++) { const c = document.createElement('canvas'); c.width = c.height = 4; c.complete = true; c.naturalWidth = 144; _at.forms[i]._img = c; } _at.next = frame;`);   // (as tests/attract.js: the sheets "arrived")
    run.eval(PT_JS);
    run.eval('canvas.width = ' + W + '; canvas.height = ' + H + '; _simLast = ' + clock.now + '; _simDebt = 0;');
    run.roots = discoverRoots(context);
    run.snap = () => { const caps = { nodes: 600000, depth: 9, coll: 6000 }; return vm.runInContext('(' + snapshotRoots.toString() + ')', context)(run.roots, caps); };
    run.core = () => vm.runInContext('(' + coreDigest.toString() + ')', context)();
    return run;
}
// advance one run by n game steps (n = 1 in direct mode, 4 in loop mode). kind: 'A' reference, 'X' the ghost way.
function advance(run, kind, n, scn, stepNo) {
    ACTIVE = run;
    for (let i = 0; i < n; i++) {   // (inputs land at the first step of a refresh)
        const st = stepNo + i, e = scn.events[st]; if (e) run.eval(e);
        for (const ev of scn.every || []) if (st >= ev.from && st < (ev.until || 1e9) && (st - ev.from) % ev.period === 0) run.eval(ev.code);
    }
    const t0 = process.hrtime.bigint();
    if (run.mode === 'direct') {
        for (let i = 0; i < n; i++) run.eval(kind === 'A' ? 'render();' : '_simStep(false);');
    } else if (kind === 'A') {
        for (let i = 0; i < n; i++) { run.clock.now += 1000 / 60; run.eval('gameLoop();'); }          // 60 Hz: a refresh is one step, drawn
    } else {
        run.clock.now += n * 1000 / 60; run.eval('gameLoop();');                                       // 15 Hz (n = 4): three steps with no picture and one drawn
    }
    run.ms += Number(process.hrtime.bigint() - t0) / 1e6; run.nsteps += n;
    run.paints = run.pen.paints;
}

// ── compare ──
const norm = p => p.replace(/\[\d+\]/g, '[]').replace(/\{[^}]*\}/g, '{}');
function diffSnaps(a, b) {
    const groups = new Map();
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
        const x = a[k], y = b[k]; if (x === y) continue;
        if (typeof x === 'number' && typeof y === 'number' && Number.isNaN(x) && Number.isNaN(y)) continue;
        const g = norm(k); let e = groups.get(g); if (!e) groups.set(g, e = { n: 0, ex: k, a: x, b: y });
        e.n++;
    }
    return groups;
}
function classify(groups) {
    const out = { fail: [], cachey: [], ignored: [] };
    for (const [g, e] of groups) { const root = g.split(/[.\[{#@]/)[0]; (IGNORE.test(root) || IGNORE_PATH.test(g) ? out.ignored : CACHEY.test(root) || CACHEY.test(g.slice(0, 80)) ? out.cachey : out.fail).push([g, e]); }
    return out;
}
const show = v => (v === undefined ? '(absent)' : typeof v === 'number' ? String(+v.toPrecision(10)) : JSON.stringify(v));
function printGroups(title, list, max) {
    if (!list.length) return;
    console.log('      ' + title);
    for (const [g, e] of list.slice(0, max)) console.log('        ' + g.padEnd(46) + ' x' + String(e.n).padEnd(5) + ' e.g. ' + e.ex + ': drawn ' + show(e.a) + '  vs  ghost ' + show(e.b));
    if (list.length > max) console.log('        … and ' + (list.length - max) + ' more');
}

async function lockstep(scnName, mode, selftest) {
    const scn = SCENARIOS[scnName], unit = mode === 'loop' ? 4 : 1;
    const A = await bootRun('A', scn, mode, 'drawn'), X = await bootRun('X', scn, mode, 'ghost');
    if (selftest) X.eval(`(function(){ const o = facilityTutorialTick; facilityTutorialTick = function () { if (_simGhost) return; return o.apply(this, arguments); }; })();`);   // a deliberately broken ghost step
    console.log(`\n${scnName} / ${mode}: ${STEPS} steps${mode === 'loop' ? ' (A: gameLoop at 60 Hz, X: gameLoop at 15 Hz = 3 ghost + 1 drawn)' : ' (A: render(), X: _simStep(false))'}; ${A.roots.length} module-level variables followed`);
    const cover = { floatMax: 0, effMax: 0, shotMax: 0, rqMax: 0, actorsMax: 0, doorsOpen: 0, lightMoves: 0, dead: 0, ghostPaints: 0 };
    let firstCore = null, firstFail = null, lastIgnored = new Map(), lastCachey = new Map(), checkpoints = 0, rngDiff = null;
    for (let step = 0; step < STEPS; step += unit) {
        advance(A, 'A', unit, scn, step); advance(X, 'X', unit, scn, step);
        ACTIVE = A; const ca = A.core(); ACTIVE = X; const cx = X.core();
        if (ca !== cx && !firstCore) {
            firstCore = step + unit; const pa = ca.split('|'), px = cx.split('|');
            const names = ['frame', 'player.x', 'player.y', 'crystal.health', 'actors', 'followers', 'floatingTexts', 'elementEffects', 'turretShots', 'respawnQueue', 'shardCount', 'actors[]', 'followers[]', 'lights#doors'];
            const bad = names.filter((n, i) => pa[i] !== px[i]);
            console.log(`  first difference in the core digest after step ${firstCore}: ${bad.join(', ')}`);
            for (const n of bad.slice(0, 4)) { const i = names.indexOf(n); const sa = String(pa[i]).split(';'), sx = String(px[i]).split(';'); let j = 0; while (j < sa.length && sa[j] === sx[j]) j++; console.log(`    ${n}${sa.length > 1 || sx.length > 1 ? '[' + j + ']' : ''}: drawn ${String(sa[j]).slice(0, 120)}   ghost ${String(sx[j]).slice(0, 120)}`); }
        }
        const sa = A.eval('[floatingTexts.length, elementEffects.length, turretShots.length, respawnQueue.length, actors.length, actors.filter(a => a.dead).length]');
        cover.floatMax = Math.max(cover.floatMax, sa[0]); cover.effMax = Math.max(cover.effMax, sa[1]); cover.shotMax = Math.max(cover.shotMax, sa[2]); cover.rqMax = Math.max(cover.rqMax, sa[3]); cover.actorsMax = Math.max(cover.actorsMax, sa[4]); cover.dead = Math.max(cover.dead, sa[5]);
        cover.doorsOpen = Math.max(cover.doorsOpen, A.eval('_fp && _fp.doorItems ? Array.from(_fp.doorItems.values()).filter(d => d.st && d.st.open > 0.5).length : 0'));
        if ((step + unit) % EVERY === 0) {
            checkpoints++;
            ACTIVE = A; const sA = A.snap(); ACTIVE = X; const sX = X.snap();
            const c = classify(diffSnaps(sA, sX));
            for (const [g, e] of c.ignored) lastIgnored.set(g, e); for (const [g, e] of c.cachey) lastCachey.set(g, e);
            if (c.fail.length && !firstFail) { firstFail = { step: step + unit, list: c.fail }; if (!process.env.KEEP_GOING) break; }
        }
    }
    cover.ghostPaints = X.paints;
    // the call sites that spent random numbers in one run and not the other: where the draw pass spends them (not a failure by itself)
    const sitesDiff = []; for (const k of new Set([...A.sites.keys(), ...X.sites.keys()])) { const a = A.sites.get(k), x = X.sites.get(k); const na = a ? a.n : 0, nx = x ? x.n : 0; if (na !== nx) sitesDiff.push([k, na, nx]); }
    sitesDiff.sort((p, q) => Math.abs(q[1] - q[2]) - Math.abs(p[1] - p[2]));
    const per = r => (r.ms / Math.max(1, r.nsteps)).toFixed(2);
    console.log(`  exercised: up to ${cover.actorsMax} actors (${cover.dead} dead), ${cover.floatMax} floating texts, ${cover.effMax} effects, ${cover.shotMax} turret shots, ${cover.rqMax} on the respawn queue, ${cover.doorsOpen} doors open; ${checkpoints} deep snapshots`);
    console.log(`  cost per step in this stub: drawn ${per(A)} ms, ghost ${per(X)} ms; paints on the real pen in the ghost run: ${cover.ghostPaints}`);
    if (VERBOSE) { console.log('  random-number call sites used a different number of times:'); for (const [k, a, x] of sitesDiff.slice(0, 12)) console.log(`    drawn ${a}  ghost ${x}   ${k}`); }
    if (firstFail) {
        console.log(`  FAIL: state differs at the snapshot after step ${firstFail.step}`);
        printGroups('state that the ghost step does not keep up:', firstFail.list, 40);
    } else console.log(`  ok: no state differs at any of ${checkpoints} snapshots`);
    printGroups('differs, but allow-listed (the clock, the pen, the readout):', [...lastIgnored], 12);
    printGroups('differs, cache-like (verify with Grep that only drawing reads it):', [...lastCachey], VERBOSE ? 60 : 12);
    const cacheyFail = process.env.STRICT_CACHES && lastCachey.size;
    if (!firstFail && firstCore) console.log('  NOTE: the core digest differed but the deep snapshots did not (a transient)');
    return { fail: !!firstFail || !!firstCore || !!cacheyFail, scn: scnName, mode };
}

(async () => {
    Math.random = siteRandom;
    const want = process.env.SCENARIO ? process.env.SCENARIO.split(',') : Object.keys(SCENARIOS);
    const modes = process.env.MODE ? process.env.MODE.split(',') : ['direct', 'loop'];
    const results = [];
    try {
        for (const s of want) for (const m of modes) { if (s === 'attract' && m === 'loop') continue; results.push(await lockstep(s, m, !!process.env.GHOST_SELFTEST)); }
    } finally { Math.random = hostRandom; }
    const bad = results.filter(r => r.fail);
    console.log(bad.length ? `\n${bad.length} of ${results.length} runs FAILED: ${bad.map(r => r.scn + '/' + r.mode).join(', ')}` : `\nall ${results.length} runs equivalent`);
    process.exit(process.env.GHOST_SELFTEST ? (bad.length ? 0 : 1) : (bad.length ? 1 : 0));   // (the self-test passes when the broken ghost step is CAUGHT)
})();
