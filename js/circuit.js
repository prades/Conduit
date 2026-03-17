// ─────────────────────────────────────────────────────────
//  CIRCUIT BOARD BACKGROUND LAYER
//  Pre-renders a dense PCB-trace pattern onto an offscreen
//  canvas once (or on resize) and blits it at low alpha each
//  frame — giving a subtle, familiar circuit-board feel.
//
//  Anatomy drawn:
//    • Horizontal bus traces  (straight + serpentine/meander)
//    • Right-angle jog detours on some horizontal runs
//    • Vertical connector traces
//    • SMD pad + via rings at trace endpoints
//    • Inline via dots along trace bodies
//    • IC chip outlines with pin dots and alignment notch
//    • Star-burst via clusters (ground/power nodes)
// ─────────────────────────────────────────────────────────

let _circuitOffscreen = null;
let _circuitSize      = { w: 0, h: 0 };

// ── xorshift32 seeded PRNG ────────────────────────────────
function _mkCircuitRng(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
        s ^= s << 13;
        s ^= s >> 17;
        s ^= s << 5;
        return (s >>> 0) / 4294967296;
    };
}

// ── Core builder — returns an offscreen HTMLCanvasElement ──
function _buildCircuit(W, H) {
    const oc     = document.createElement('canvas');
    oc.width     = W;
    oc.height    = H;
    const c      = oc.getContext('2d');
    const rng    = _mkCircuitRng(0xC0FFEE42);

    // Grid geometry
    const CELL   = 20;                          // px per grid cell — smaller = denser
    const COLS   = Math.ceil(W / CELL) + 2;
    const ROWS   = Math.ceil(H / CELL) + 2;

    // Stroke / geometry constants
    const TW     = 1.3;   // trace line-width
    const PAD_R  = 3.0;   // SMD pad radius
    const VIA_R  = 1.6;   // small via dot radius
    const VIA_RG = 2.9;   // via annular ring radius

    // Colour palette — dim variants of the game's neon greens / cyans
    const PALETTE = ['#0f8', '#0df', '#0fa', '#3fc', '#0cf', '#2fd', '#1ee'];
    const pick    = () => PALETTE[Math.floor(rng() * PALETTE.length)];

    c.lineCap  = 'square';
    c.lineJoin = 'miter';

    // ── Helpers ───────────────────────────────────────────

    // SMD pad + thin annular ring
    function drawPad(x, y, col, r) {
        r = r || PAD_R;
        c.fillStyle   = col;
        c.strokeStyle = col;
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
        c.lineWidth = 0.65;
        c.beginPath(); c.arc(x, y, r + 2.6, 0, Math.PI * 2); c.stroke();
    }

    // Tiny via dot + ring
    function drawVia(x, y, col) {
        c.fillStyle   = col;
        c.strokeStyle = col;
        c.lineWidth   = 0.65;
        c.beginPath(); c.arc(x, y, VIA_R,  0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(x, y, VIA_RG, 0, Math.PI * 2); c.stroke();
    }

    // ─────────────────────────────────────────────────────
    // PASS 1 — Horizontal traces
    //   Each row band can carry 1–2 independent traces.
    //   Three style variants: straight, serpentine meander,
    //   right-angle jog detour.
    // ─────────────────────────────────────────────────────
    for (let row = 0; row < ROWS; row++) {
        const passCount = rng() > 0.45 ? 2 : 1;
        for (let pass = 0; pass < passCount; pass++) {
            if (rng() > 0.65) continue;

            const col  = pick();
            const y    = row * CELL + Math.round((rng() - 0.5) * CELL * 0.42);
            const c0   = Math.floor(rng() * COLS * 0.45);
            const c1   = c0 + 3 + Math.floor(rng() * (COLS - c0 - 3) * 0.80);
            const x0   = c0 * CELL;
            const x1   = Math.min(c1, COLS - 1) * CELL;

            c.strokeStyle = col;
            c.lineWidth   = TW;
            c.beginPath();
            c.moveTo(x0, y);

            const mode = rng();

            if (mode > 0.68) {
                // ── Serpentine / meander  (the snake PCB pattern) ──────
                const segW = CELL * (1 + Math.floor(rng() * 2));
                const amp  = CELL * (0.38 + rng() * 0.42);
                const sign = rng() > 0.5 ? 1 : -1;
                const legs = 3 + Math.floor(rng() * 7);
                // Lead-in to meander start
                const leadIn = x0 + (x1 - x0) * (0.05 + rng() * 0.15);
                c.lineTo(leadIn, y);
                for (let leg = 0; leg < legs; leg++) {
                    const dir = leg % 2 === 0 ? sign : -sign;
                    const lx  = leadIn + leg * segW;
                    c.lineTo(lx,        y);
                    c.lineTo(lx,        y + amp * dir);
                    c.lineTo(lx + segW, y + amp * dir);
                    c.lineTo(lx + segW, y);
                }
                c.lineTo(x1, y);

            } else if (mode > 0.38) {
                // ── Right-angle jog detour ──────────────────────────────
                const mid  = x0 + (x1 - x0) * (0.28 + rng() * 0.44);
                const yOff = CELL * (rng() > 0.5 ? 1 : -1) * (0.5 + Math.floor(rng() * 2));
                const jog  = CELL * (0.4 + rng() * 0.8);
                c.lineTo(mid, y);
                c.lineTo(mid, y + yOff);
                c.lineTo(mid + jog, y + yOff);
                c.lineTo(mid + jog, y);
                c.lineTo(x1, y);

            } else {
                // ── Straight bus trace ──────────────────────────────────
                c.lineTo(x1, y);
            }

            c.stroke();

            // Endpoint pads
            drawPad(x0, y, col);
            drawPad(x1, y, col);

            // Optional inline via
            if (rng() > 0.48) {
                drawVia(x0 + (x1 - x0) * (0.22 + rng() * 0.56), y, col);
            }
            // Second inline via for longer traces
            if ((x1 - x0) > CELL * 6 && rng() > 0.55) {
                drawVia(x0 + (x1 - x0) * (0.55 + rng() * 0.25), y, col);
            }
        }
    }

    // ─────────────────────────────────────────────────────
    // PASS 2 — Vertical connector traces
    //   Tie horizontal buses together — creates the dense
    //   interconnect look of a real PCB.
    // ─────────────────────────────────────────────────────
    for (let col = 0; col < COLS; col++) {
        const passCount = rng() > 0.50 ? 2 : 1;
        for (let pass = 0; pass < passCount; pass++) {
            if (rng() > 0.58) continue;

            const colour = pick();
            const x      = col * CELL + Math.round((rng() - 0.5) * CELL * 0.42);
            const r0     = Math.floor(rng() * ROWS * 0.50);
            const r1     = r0 + 2 + Math.floor(rng() * (ROWS - r0 - 2) * 0.65);
            const y0     = r0 * CELL;
            const y1     = Math.min(r1, ROWS - 1) * CELL;

            c.strokeStyle = colour;
            c.lineWidth   = TW;
            c.beginPath();
            c.moveTo(x, y0);
            c.lineTo(x, y1);
            c.stroke();

            drawPad(x, y0, colour);
            drawPad(x, y1, colour);

            // Inline via on taller verticals
            if ((y1 - y0) > CELL * 4 && rng() > 0.50) {
                drawVia(x, y0 + (y1 - y0) * (0.3 + rng() * 0.4), colour);
            }
        }
    }

    // ─────────────────────────────────────────────────────
    // PASS 3 — IC chip / SoC component outlines
    //   Rectangular body, alignment notch, pin dots on all
    //   four sides — looks like a QFP or SOIC package.
    // ─────────────────────────────────────────────────────
    const numICs = Math.floor((COLS * ROWS) * 0.008);
    for (let i = 0; i < numICs; i++) {
        const icCol = pick();
        const cx    = (1 + Math.floor(rng() * (COLS - 3))) * CELL;
        const cy    = (1 + Math.floor(rng() * (ROWS - 3))) * CELL;
        const icW   = CELL * (2 + Math.floor(rng() * 3));
        const icH   = CELL * (1 + Math.floor(rng() * 2));
        const L     = cx - icW / 2, T = cy - icH / 2;

        c.strokeStyle = icCol;
        c.lineWidth   = 0.85;
        c.strokeRect(L, T, icW, icH);

        // Alignment notch (semicircle cut-out on top edge)
        c.beginPath();
        c.arc(cx, T, icH * 0.14, Math.PI, 0);
        c.stroke();

        // Pin dots — top & bottom rows
        c.fillStyle = icCol;
        const pH = Math.max(2, Math.floor(icW / CELL));
        for (let p = 0; p <= pH; p++) {
            const px = L + (p / pH) * icW;
            c.beginPath(); c.arc(px, T,          1.4, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(px, T + icH, 1.4, 0, Math.PI * 2); c.fill();
        }
        // Pin dots — left & right columns
        const pV = Math.max(2, Math.floor(icH / CELL));
        for (let p = 0; p <= pV; p++) {
            const py = T + (p / pV) * icH;
            c.beginPath(); c.arc(L,       py, 1.4, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(L + icW, py, 1.4, 0, Math.PI * 2); c.fill();
        }
    }

    // ─────────────────────────────────────────────────────
    // PASS 4 — Star-burst via clusters
    //   Radial right-angle spokes from a central pad — these
    //   mimic power/ground plane stitch vias and fanout pads
    //   that appear densely across real PCBs.
    // ─────────────────────────────────────────────────────
    const numClusters = Math.floor(COLS * 0.38);
    for (let i = 0; i < numClusters; i++) {
        const clCol = pick();
        const cx    = rng() * W;
        const cy    = rng() * H;
        const arms  = 4 + Math.floor(rng() * 8);
        const rad   = CELL * (1.1 + rng() * 1.9);

        c.strokeStyle = clCol;
        c.fillStyle   = clCol;
        c.lineWidth   = TW;

        for (let a = 0; a < arms; a++) {
            const ang = (a / arms) * Math.PI * 2 + rng() * 0.45;
            const nx  = cx + Math.cos(ang) * rad * (0.45 + rng() * 0.55);
            const ny  = cy + Math.sin(ang) * rad * (0.45 + rng() * 0.55);

            // Right-angle routing: horizontal then vertical
            c.beginPath();
            c.moveTo(cx, cy);
            c.lineTo(nx, cy);   // horizontal leg first
            c.lineTo(nx, ny);   // then vertical
            c.stroke();

            // Tip via
            c.beginPath(); c.arc(nx, ny, VIA_R, 0, Math.PI * 2); c.fill();
        }

        // Central junction pad
        drawPad(cx, cy, clCol);
    }

    // ─────────────────────────────────────────────────────
    // PASS 5 — Extra dense serpentine fills
    //   Tight meander loops placed in random empty areas to
    //   boost PCB density, matching the look of impedance-
    //   controlled differential pairs or delay lines.
    // ─────────────────────────────────────────────────────
    const numMeanders = Math.floor(COLS * 0.22);
    for (let i = 0; i < numMeanders; i++) {
        const mCol  = pick();
        const mx    = rng() * (W - CELL * 6);
        const my    = rng() * (H - CELL * 4);
        const loops = 3 + Math.floor(rng() * 5);
        const mW    = CELL * (0.8 + rng() * 0.6);
        const mH    = CELL * (0.6 + rng() * 0.5);
        const horiz = rng() > 0.5; // horizontal or vertical orientation

        c.strokeStyle = mCol;
        c.lineWidth   = TW * 0.85;
        c.beginPath();

        if (horiz) {
            // Horizontal meander: left→right zigzag
            c.moveTo(mx, my);
            for (let l = 0; l < loops; l++) {
                const dir = l % 2 === 0 ? 1 : -1;
                c.lineTo(mx + l * mW,       my);
                c.lineTo(mx + l * mW,       my + mH * dir);
                c.lineTo(mx + (l + 1) * mW, my + mH * dir);
                c.lineTo(mx + (l + 1) * mW, my);
            }
        } else {
            // Vertical meander: top→bottom zigzag
            c.moveTo(mx, my);
            for (let l = 0; l < loops; l++) {
                const dir = l % 2 === 0 ? 1 : -1;
                c.lineTo(mx,            my + l * mH);
                c.lineTo(mx + mW * dir, my + l * mH);
                c.lineTo(mx + mW * dir, my + (l + 1) * mH);
                c.lineTo(mx,            my + (l + 1) * mH);
            }
        }
        c.stroke();
    }

    return oc;
}

// ── Public API ────────────────────────────────────────────

function initCircuitLayer() {
    _circuitOffscreen = _buildCircuit(canvas.width, canvas.height);
    _circuitSize.w    = canvas.width;
    _circuitSize.h    = canvas.height;
}

function drawCircuitLayer() {
    // Lazy init and rebuild on resize — no external initCircuitLayer() call needed
    if (!_circuitOffscreen || _circuitSize.w !== canvas.width || _circuitSize.h !== canvas.height) {
        _circuitOffscreen = _buildCircuit(canvas.width, canvas.height);
        _circuitSize.w    = canvas.width;
        _circuitSize.h    = canvas.height;
    }

    ctx.save();
    ctx.globalAlpha = 0.058; // subtle — just enough to read the pattern
    ctx.drawImage(_circuitOffscreen, 0, 0);
    ctx.restore();
}
