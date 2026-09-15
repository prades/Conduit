// ─────────────────────────────────────────────────────────
//  POST-PROCESSING + DYNAMIC LIGHTING
//
//  The world is drawn straight to the visible canvas by game.js. This module
//  runs after the world pass and before the HUD pass, so the scene gets bloom,
//  light and grain while the interface stays crisp.
//
//  Bloom is built from repeated drawImage downscales instead of ctx.filter,
//  which Safari only shipped in 18 — the bilinear upscale is the blur.
//
//  Cost rules this file follows, because the target is a tablet:
//   · full-screen gradient and pattern fills are far slower than a blit, so the
//     vignette and scanlines are baked once into one overlay and blitted;
//   · the light buffer is quarter-res, since radial-gradient fill is the single
//     most expensive thing here and it scales with area;
//   · LOW runs one bloom tap, not two.
// ─────────────────────────────────────────────────────────

const FX_LEVELS = ['off', 'low', 'medium', 'high'];

// ── Buffers ──────────────────────────────────────────────
// Declared before the level functions on purpose: fxApplyLevel runs during this
// script's own evaluation and invalidates _fxOv, which would be a temporal dead
// zone ReferenceError if these `let`s came later in the file.
const LT_SCALE = 0.25;   // light buffer resolution relative to the screen

let _fxW = 0, _fxH = 0;
let _fxB1, _fxB1c;   // quarter-res scene copy
let _fxB2, _fxB2c;   // quarter-res bright pass
let _fxB3, _fxB3c;   // sixteenth-res wide blur
let _fxLt, _fxLtc;   // quarter-res light accumulation
let _fxCA, _fxCAc;   // channel tint for aberration
let _fxOv = null;    // baked vignette + scanlines, one blit per frame
let _fxGrain, _fxGrainPat = null;

const FX = {
    level:      'low',
    lights:     true,
    haze:       0.16,   // additive strength of the light buffer
    shadows:    true,
    bloom:      true,
    bloomTwoTap:false,
    bloomTight: false,
    vignette:   true,
    scanlines:  false,
    grain:      false,
    sweep:      false,
    aberration: false,
};

let fxUserSet = false;   // true once the player picks a level, which stops auto-downgrade

function fxApplyLevel(level) {
    if (FX_LEVELS.indexOf(level) < 0) level = 'low';
    const prevOverlayKey = _fxOverlayKey();
    FX.level = level;
    const on = (...levels) => levels.indexOf(level) >= 0;
    FX.lights      = on('low', 'medium', 'high');
    FX.shadows     = on('low', 'medium', 'high');
    FX.bloom       = on('low', 'medium', 'high');
    FX.bloomTwoTap = on('medium', 'high');
    FX.bloomTight  = on('high');
    FX.vignette    = on('low', 'medium', 'high');
    FX.scanlines   = on('medium', 'high');
    // Grain, sweep and aberration are the three that cost most for what they
    // add, so they are the reward for a device that can hold 60fps.
    FX.grain       = on('high');
    FX.sweep       = on('high');
    FX.aberration  = on('high');
    FX.haze        = level === 'high' ? 0.20 : level === 'medium' ? 0.18 : 0.15;
    if (_fxOverlayKey() !== prevOverlayKey) _fxOv = null;
}

function fxSetLevel(level) {
    fxUserSet = true;
    fxApplyLevel(level);
    try { localStorage.setItem('conduit.fx', level); } catch (e) {}
}

function fxCycleLevel() {
    const i = FX_LEVELS.indexOf(FX.level);
    fxSetLevel(FX_LEVELS[(i + 1) % FX_LEVELS.length]);
    return FX.level;
}

(function fxInitLevel() {
    let saved = null;
    try { saved = localStorage.getItem('conduit.fx'); } catch (e) {}
    if (saved && FX_LEVELS.indexOf(saved) >= 0) { fxUserSet = true; fxApplyLevel(saved); return; }
    // No stored choice. Start conservative — the perf watchdog only steps down,
    // never up, so guessing high on a weak tablet costs the player a slow start.
    const cores = navigator.hardwareConcurrency || 4;
    const wide  = Math.max(window.innerWidth, window.innerHeight) >= 1400;
    fxApplyLevel(wide && cores >= 8 ? 'medium' : 'low');
})();

function _fxOverlayKey() { return (FX.vignette ? 'v' : '') + (FX.scanlines ? 's' : ''); }

function _fxMakeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width  = Math.max(1, Math.floor(w));
    c.height = Math.max(1, Math.floor(h));
    return c;
}

function _fxEnsureBuffers(w, h) {
    if (w === _fxW && h === _fxH && _fxB1) return;
    _fxW = w; _fxH = h;
    _fxB1 = _fxMakeCanvas(w / 4,  h / 4);  _fxB1c = _fxB1.getContext('2d');
    _fxB2 = _fxMakeCanvas(w / 4,  h / 4);  _fxB2c = _fxB2.getContext('2d');
    _fxB3 = _fxMakeCanvas(w / 16, h / 16); _fxB3c = _fxB3.getContext('2d');
    _fxLt = _fxMakeCanvas(w * LT_SCALE, h * LT_SCALE); _fxLtc = _fxLt.getContext('2d');
    _fxCA = _fxMakeCanvas(w / 16, h / 16); _fxCAc = _fxCA.getContext('2d');
    _fxOv = null;
    if (!_fxGrain) {
        _fxGrain = _fxMakeCanvas(96, 96);
        const gc  = _fxGrain.getContext('2d');
        const img = gc.createImageData(96, 96);
        for (let i = 0; i < img.data.length; i += 4) {
            // Centred on mid-grey so the overlay blend adds texture without
            // lifting or crushing overall brightness.
            const v = 98 + Math.floor(Math.random() * 61);
            img.data[i] = img.data[i+1] = img.data[i+2] = v;
            img.data[i+3] = 255;
        }
        gc.putImageData(img, 0, 0);
        _fxGrainPat = null;
    }
}

// Vignette and scanlines never change within a screen size, so they are baked
// into one RGBA layer and blitted. That replaces a full-screen gradient fill
// plus a full-screen pattern fill with a single drawImage every frame.
function _fxBuildOverlay(w, h) {
    _fxOv = _fxMakeCanvas(w, h);
    const oc = _fxOv.getContext('2d');
    if (FX.vignette) {
        const r = Math.hypot(w, h) * 0.60;
        const g = oc.createRadialGradient(w / 2, h / 2, r * 0.48, w / 2, h / 2, r);
        g.addColorStop(0,    'rgba(0,0,0,0)');
        g.addColorStop(0.72, 'rgba(0,0,0,0.14)');
        g.addColorStop(1,    'rgba(0,0,0,0.42)');
        oc.fillStyle = g;
        oc.fillRect(0, 0, w, h);
    }
    if (FX.scanlines) {
        oc.fillStyle = 'rgba(0,0,0,0.16)';
        for (let y = 2; y < h; y += 3) oc.fillRect(0, y, w, 1);
    }
}

// ── Colour parsing ───────────────────────────────────────
const _fxRGBCache = new Map();
function _fxRGB(col) {
    if (!col) return [255, 255, 255];
    const hit = _fxRGBCache.get(col);
    if (hit) return hit;
    let out = [255, 255, 255];
    const s = String(col).trim();
    if (s[0] === '#') {
        if (s.length === 4) {
            out = [parseInt(s[1]+s[1],16), parseInt(s[2]+s[2],16), parseInt(s[3]+s[3],16)];
        } else if (s.length >= 7) {
            out = [parseInt(s.substr(1,2),16), parseInt(s.substr(3,2),16), parseInt(s.substr(5,2),16)];
        }
    } else {
        const m = s.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (m) out = [+m[1], +m[2], +m[3]];
    }
    if (out.some(isNaN)) out = [255, 255, 255];
    _fxRGBCache.set(col, out);
    return out;
}

// ── Light accumulation ───────────────────────────────────
let _fxLightCount = 0;
let _fxPrepared   = false;
const FX_MAX_LIGHTS = 30;

function _fxClearLights() {
    _fxLightCount = 0;
    _fxLtc.globalCompositeOperation = 'copy';
    _fxLtc.fillStyle = '#000';
    _fxLtc.fillRect(0, 0, _fxLt.width, _fxLt.height);
    _fxLtc.globalCompositeOperation = 'lighter';
    _fxPrepared = true;
}

function fxBeginFrame() {
    _fxPrepared = false;
    if (FX.level === 'off') return;
    _fxEnsureBuffers(canvas.width, canvas.height);
    if (!FX.lights) return;
    _fxClearLights();
}

// Screen-space light. radius is in screen pixels, intensity 0..1.
function pushLight(sx, sy, radius, color, intensity) {
    if (!FX.lights || !_fxLtc || _fxLightCount >= FX_MAX_LIGHTS) return;
    if (!(radius > 0) || !(intensity > 0)) return;
    if (!isFinite(sx) || !isFinite(sy)) return;   // an emitter with no world position
    const x = sx * LT_SCALE, y = sy * LT_SCALE, r = radius * LT_SCALE;
    if (r < 1.5) return;                          // too small to survive the upscale
    if (x < -r || y < -r || x > _fxLt.width + r || y > _fxLt.height + r) return;
    _fxLightCount++;
    const [rr, gg, bb] = _fxRGB(color);
    const a = Math.min(1, intensity);
    // Steep falloff — a broad, gentle ramp reads as fog over the whole scene
    // rather than as a light source sitting in it.
    const g = _fxLtc.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0,    `rgba(${rr},${gg},${bb},${a})`);
    g.addColorStop(0.28, `rgba(${rr},${gg},${bb},${a * 0.22})`);
    g.addColorStop(1,    `rgba(${rr},${gg},${bb},0)`);
    _fxLtc.fillStyle = g;
    _fxLtc.fillRect(x - r, y - r, r * 2, r * 2);
}

// World-space light — same projection the render loop uses.
function pushWorldLight(wx, wy, radius, color, intensity, yLift) {
    const sx = (wx - player.visualX - (wy - player.visualY)) * TILE_W + canvas.width  / 2;
    const sy = (wx - player.visualX + (wy - player.visualY)) * TILE_H + canvas.height / 2 - (yLift || 0);
    pushLight(sx, sy, radius, color, intensity);
}

// Everything that should cast light is read straight off game state, so no
// call sites in the 14k-line draw code need to change. Ordered brightest-first,
// because the per-frame budget truncates the tail.
function _fxCollectSceneLights() {
    if (!FX.lights) return;
    const arr = a => (Array.isArray(a) ? a : null);

    if (typeof crystal !== 'undefined' && crystal && crystal.health > 0) {
        const hpR = crystal.health / crystal.maxHealth;
        const col = hpR > 0.5 ? '#1e9bff' : hpR > 0.2 ? '#ff8200' : '#ff2828';
        pushWorldLight(crystal.x, crystal.y, 190, col, 0.34 + 0.06 * Math.sin(frame * 0.05), 44);
    }

    if (typeof player !== 'undefined' && player) {
        const el = ELEMENTS.find(e => e.id === player.selectedElement);
        pushWorldLight(player.visualX, player.visualY, 105, el ? el.color : '#00ff88', 0.24, 34);
    }

    const fx = arr(typeof elementEffects !== 'undefined' ? elementEffects : null);
    if (fx) {
        for (const e of fx) {
            if (!e || e.x === undefined) continue;
            const fade = Math.min(1, (e.life || 0) / 30);
            if (fade <= 0.05) continue;
            pushWorldLight(e.x, e.y, Math.max(0.35, e.radius || 0.6) * TILE_W, e.color, 0.34 * fade, 26);
        }
    }

    const pylons = arr(typeof _pillarCache !== 'undefined' ? _pillarCache : null);
    if (pylons) {
        for (const p of pylons) {
            const col = p.attackModeColor || p.pillarCol ||
                        (p.pillarTeam === 'green' ? '#00ff88' : '#ff3322');
            // An upgraded turret is a much brighter emitter than a dormant pylon.
            const hot = p.attackMode || p.waveMode;
            pushWorldLight(p.x, p.y, hot ? 135 : 95, col,
                           hot ? 0.34 : p.upgraded ? 0.24 : 0.15, 40);
        }
    }

    const shots = [
        arr(typeof projectiles !== 'undefined' ? projectiles : null),
        arr(typeof followerProjectiles !== 'undefined' ? followerProjectiles : null),
    ];
    for (const list of shots) {
        if (!list) continue;
        for (const p of list) {
            if (!p || p.x === undefined) continue;
            pushWorldLight(p.x, p.y, 62, p.color || '#ffcc44', 0.28, 40);
        }
    }

    const panels = arr(typeof _wallPanelCache !== 'undefined' ? _wallPanelCache : null);
    if (panels) {
        for (const t of panels) {
            const charging = (t.siphonProgress || 0) > 0;
            pushWorldLight(t.x, t.y, charging ? 105 : 66, charging ? '#ffdd44' : '#ff8800',
                           charging ? 0.32 : 0.18, 46);
        }
    }

    const nests = arr(typeof _nestCache !== 'undefined' ? _nestCache : null);
    if (nests) {
        for (const n of nests) {
            if (n.nestHealth <= 0) continue;
            const hacking = (n.nestHackProgress || 0) > 0;
            pushWorldLight(n.x, n.y, hacking ? 115 : 88,
                           hacking ? '#ffaa22' : '#ff2a1a', hacking ? 0.32 : 0.18, 30);
        }
    }

    const haz = arr(typeof environmentalHazards !== 'undefined' ? environmentalHazards : null);
    if (haz) {
        for (const h of haz) {
            if (!h) continue;
            if (h.type === 'acid' && Array.isArray(h.tiles)) {
                // One light per pool, not per tile — pools can be dozens of tiles.
                let sx = 0, sy = 0, n = 0;
                for (const t of h.tiles) { sx += t[0]; sy += t[1]; n++; }
                if (n) pushWorldLight(sx / n, sy / n, 50 + n * 7, '#00ff44', 0.22 * (h.alpha ?? 1), 6);
            } else if (h.x !== undefined) {
                pushWorldLight(h.x, h.y, 74, h.color || '#ff6622', 0.18, 14);
            }
        }
    }

    const nodes = arr(typeof _capturableNodeCache !== 'undefined' ? _capturableNodeCache : null);
    if (nodes) {
        for (const t of nodes) pushWorldLight(t.x, t.y, 92, t.captured ? '#00ddff' : '#ffcc00', 0.18, 52);
    }

    const trapList = arr(typeof traps !== 'undefined' ? traps : null);
    if (trapList) {
        for (const t of trapList) {
            if (!t || t.alive === false) continue;
            pushWorldLight(t.x, t.y, 48, t.color || '#66ffcc', 0.14, 8);
        }
    }
}

// ── Contact shadow (called from the depth-sorted draw pass) ──
function fxContactShadow(px, py, rx, alpha) {
    if (!FX.shadows) return;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(1, 0.40);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0,    `rgba(0,0,0,${0.55 * alpha})`);
    g.addColorStop(0.50, `rgba(0,0,0,${0.24 * alpha})`);
    g.addColorStop(1,     'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

// ── Auto-downgrade so a weak tablet is not stuck at a level it cannot hold ──
let _fxLastT = 0, _fxAvgMs = 16, _fxSlowFrames = 0;
function _fxWatchPerf() {
    const now = performance.now();
    if (_fxLastT) {
        const dt = now - _fxLastT;
        if (dt < 400) _fxAvgMs += (dt - _fxAvgMs) * 0.08;   // ignore tab-switch gaps
    }
    _fxLastT = now;
    if (fxUserSet || FX.level === 'off' || FX.level === 'low') { _fxSlowFrames = 0; return; }
    if (_fxAvgMs > 22) {
        if (++_fxSlowFrames > 90) {
            _fxSlowFrames = 0;
            fxApplyLevel(FX.level === 'high' ? 'medium' : 'low');
            if (typeof floatingTexts !== 'undefined') {
                floatingTexts.push({ x: canvas.width / 2, y: 120, life: 180, vy: -0.2, size: 11,
                    color: '#8899aa', text: '◈ GRAPHICS → ' + FX.level.toUpperCase() });
            }
        }
    } else {
        _fxSlowFrames = 0;
    }
}

// ── The composite pass ───────────────────────────────────
function fxComposite() {
    if (FX.level === 'off') return;
    const w = canvas.width, h = canvas.height;
    if (w < 8 || h < 8) return;
    _fxEnsureBuffers(w, h);
    _fxWatchPerf();

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // The world pass leaves whatever blend state it last used; every block below
    // assumes a clean slate.
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;

    // ── Light — additive, so emitters bleed colour into the air around them ──
    if (FX.lights) {
        // The level can change between frame start and here (the player tapped a
        // new quality), in which case the buffer still holds the previous frame
        // and 'lighter' would stack onto it forever.
        if (!_fxPrepared) _fxClearLights();
        _fxCollectSceneLights();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = FX.haze;
        ctx.drawImage(_fxLt, 0, 0, w, h);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    // ── Bloom — bright pass, then blur taps added back ──
    if (FX.bloom) {
        _fxB1c.globalCompositeOperation = 'copy';
        _fxB1c.imageSmoothingEnabled = true;
        _fxB1c.drawImage(canvas, 0, 0, w, h, 0, 0, _fxB1.width, _fxB1.height);

        // Multiplying the copy by itself squares each channel, which crushes the
        // dark floor away and leaves the neon. A third pass cubes it, tightening
        // the threshold so only genuinely hot pixels bloom.
        _fxB2c.globalCompositeOperation = 'copy';
        _fxB2c.drawImage(_fxB1, 0, 0);
        _fxB2c.globalCompositeOperation = 'multiply';
        _fxB2c.drawImage(_fxB1, 0, 0);
        if (FX.bloomTight) _fxB2c.drawImage(_fxB1, 0, 0);
        _fxB2c.globalCompositeOperation = 'source-over';

        _fxB3c.globalCompositeOperation = 'copy';
        _fxB3c.imageSmoothingEnabled = true;
        _fxB3c.drawImage(_fxB2, 0, 0, _fxB2.width, _fxB2.height, 0, 0, _fxB3.width, _fxB3.height);

        ctx.globalCompositeOperation = 'lighter';
        // Additive gain is kept well under 1.0 across the taps so a hot neon
        // pixel grows a halo instead of clipping the whole sprite to white.
        if (FX.bloomTwoTap) {
            ctx.globalAlpha = FX.bloomTight ? 0.42 : 0.30;
            ctx.drawImage(_fxB2, 0, 0, w, h);
        }
        ctx.globalAlpha = FX.bloomTwoTap ? 0.40 : 0.46;
        ctx.drawImage(_fxB3, 0, 0, w, h);

        // ── Chromatic aberration — tint the wide bloom tap and offset the
        //    copies, so fringing shows on hot edges where a lens would show it.
        if (FX.aberration) {
            const off = Math.max(2, w * 0.002);
            const fringe = (tint, dx) => {
                _fxCAc.globalCompositeOperation = 'copy';
                _fxCAc.drawImage(_fxB3, 0, 0);
                _fxCAc.globalCompositeOperation = 'multiply';
                _fxCAc.fillStyle = tint;
                _fxCAc.fillRect(0, 0, _fxCA.width, _fxCA.height);
                _fxCAc.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 0.20;
                ctx.drawImage(_fxCA, dx, 0, w, h);
            };
            fringe('#ff2050', -off);
            fringe('#20a0ff',  off);
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    // ── Travelling scanline sweep ──
    if (FX.sweep) {
        const band = 110;
        const sy = ((frame * 1.1) % (h + band * 2)) - band;
        const g = ctx.createLinearGradient(0, sy - band, 0, sy + band);
        g.addColorStop(0,   'rgba(120,220,255,0)');
        g.addColorStop(0.5, 'rgba(120,220,255,0.04)');
        g.addColorStop(1,   'rgba(120,220,255,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g;
        ctx.fillRect(0, sy - band, w, band * 2);
        ctx.globalCompositeOperation = 'source-over';
    }

    // ── Film grain — the tile is offset each frame so it never looks static ──
    if (FX.grain) {
        if (!_fxGrainPat) _fxGrainPat = ctx.createPattern(_fxGrain, 'repeat');
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.07;
        ctx.translate(-(frame * 7) % 96, -(frame * 13) % 96);
        ctx.fillStyle = _fxGrainPat;
        ctx.fillRect(0, 0, w + 96, h + 96);
        ctx.restore();
    }

    // ── Vignette + scanlines, baked into one layer ──
    if (FX.vignette || FX.scanlines) {
        if (!_fxOv) _fxBuildOverlay(w, h);
        ctx.drawImage(_fxOv, 0, 0);
    }

    ctx.restore();
}
