// ═══════════════════════════════════════════════════════════════
//  CAVE-IN — rules engine
//
//  Kept free of DOM so the mechanics can be tested directly. Everything
//  here is a pure function over a grid, a miner, or a level number.
//
//  A grid is ROWS arrays of COLS entries, each null or { t, dmg } where t
//  is a rock type key and dmg is accumulated damage. Row 0 is the ceiling.
// ═══════════════════════════════════════════════════════════════
const ENGINE = (function () {
  'use strict';

  const COLS = 11, ROWS = 16;

  // hard   — damage it takes to crumble, and the resistance it offers
  // impact — how hard it hits neighbours when it lands
  // A rock only damages a neighbour when impact exceeds that neighbour's
  // hardness, so granite pulverises dirt and glances off granite.
  const ROCKS = {
    DIRT:    { hard: 1, impact: 1, score: 0,   colour: '#8a6244', name: 'Dirt' },
    COAL:    { hard: 2, impact: 3, score: 10,  colour: '#3a3a44', name: 'Coal' },
    STONE:   { hard: 3, impact: 4, score: 0,   colour: '#6f7480', name: 'Stone' },
    GRANITE: { hard: 5, impact: 7, score: 0,   colour: '#4a4f63', name: 'Granite' },
    DIAMOND: { hard: 4, impact: 2, score: 250, colour: '#5fe0ff', name: 'Diamond', pickup: true },
    BOMB:    { hard: 1, impact: 1, score: 25,  colour: '#e8503a', name: 'Bomb', pickup: true, blast: 2 },
    BEDROCK: { hard: 999, impact: 0, score: 0, colour: '#232733', name: 'Bedrock' },
  };

  // ── difficulty ───────────────────────────────────────────────
  // One pressure value drives every knob, so difficulty stays coherent as
  // it scales instead of each parameter drifting on its own curve.
  //
  //     P(L) = 1 - e^(-(L-1)/K)
  //
  // P rises from 0 at level 1 and approaches 1, never reaching it, so the
  // game keeps tightening forever without hitting a wall where it becomes
  // impossible. K is the only skill dial: a larger K stretches the same
  // curve over more levels, which is what makes one design serve players
  // of very different ability.
  const MODES = {
    CASUAL: { K: 14, label: 'CASUAL' },   // gentle ramp, lots of room
    MINER:  { K: 8,  label: 'MINER'  },
    DEEP:   { K: 4,  label: 'DEEP'   },   // steep — pressure arrives fast
  };

  function difficulty(level, modeKey) {
    const K = (MODES[modeKey] || MODES.MINER).K;
    const P = 1 - Math.exp(-(Math.max(1, level) - 1) / K);

    return {
      pressure: P,
      // interval between falling rocks, in ms
      dropMs: Math.round(1500 - 1150 * P),
      // how fast a rock descends one row while falling
      stepMs: Math.round(320 - 250 * P),
      // heavy rock share climbs; dirt gives way to granite
      hardChance: 0.06 + 0.44 * P,
      // bombs thin out but never vanish — there is always an out
      bombChance: Math.max(0.05, 0.14 - 0.06 * P),
      // diamonds get slightly scarcer as more are demanded
      diamondChance: Math.max(0.06, 0.14 - 0.05 * P),
      // quota grows linearly while everything else curves, so the ceiling
      // on a run is set by endurance rather than by reflex alone
      quota: 3 + Math.floor((level - 1) * 0.8),
      // rows of rubble the level starts with
      startRubble: Math.min(5, Math.floor(P * 7)),
    };
  }

  // ── grid helpers ─────────────────────────────────────────────
  const emptyGrid = () =>
    Array.from({ length: ROWS }, () => new Array(COLS).fill(null));

  const inBounds = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
  const at = (g, r, c) => (inBounds(r, c) ? g[r][c] : undefined);

  function pickRockType(d, rnd) {
    const R = rnd || Math.random;
    const x = R();
    if (x < d.bombChance) return 'BOMB';
    if (x < d.bombChance + d.diamondChance) return 'DIAMOND';
    const y = R();
    if (y < d.hardChance * 0.4) return 'GRANITE';
    if (y < d.hardChance) return 'STONE';
    if (y < d.hardChance + 0.3) return 'COAL';
    return 'DIRT';
  }

  const makeRock = t => ({ t, dmg: 0 });

  // ── impact ───────────────────────────────────────────────────
  // A landing rock damages its four neighbours by (impact - hardness).
  // Anything whose accumulated damage reaches its hardness crumbles, and
  // a crumbling rock passes on a reduced share of the hit, so a heavy
  // landing can ripple outward instead of stopping at one tile.
  const NEIGHBOURS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function applyImpact(grid, r, c, destroyed, force) {
    const lander = grid[r] && grid[r][c];
    if (!lander) return;
    const impact = force !== undefined ? force : ROCKS[lander.t].impact;
    if (impact <= 0) return;

    for (const [dr, dc] of NEIGHBOURS) {
      const nr = r + dr, nc = c + dc;
      const cell = at(grid, nr, nc);
      if (!cell) continue;
      const spec = ROCKS[cell.t];
      if (spec.hard >= 999) continue;                  // bedrock absorbs everything
      const dmg = impact - spec.hard;
      if (dmg <= 0) continue;

      cell.dmg += dmg;
      if (cell.dmg >= spec.hard) {
        destroyed.add(nr + ',' + nc);
        grid[nr][nc] = null;
        applyImpact(grid, nr, nc, destroyed, Math.floor(impact / 2));  // ripple
      }
    }
  }

  function detonate(grid, r, c, destroyed) {
    const radius = ROCKS.BOMB.blast;
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) + Math.abs(dc) > radius) continue;   // diamond blast shape
        const nr = r + dr, nc = c + dc;
        const cell = at(grid, nr, nc);
        if (!cell) continue;
        if (ROCKS[cell.t].hard >= 999) continue;
        destroyed.add(nr + ',' + nc);
        grid[nr][nc] = null;
      }
    }
    destroyed.add(r + ',' + c);
    if (grid[r]) grid[r][c] = null;
  }

  // ── gravity ──────────────────────────────────────────────────
  // Returns true if anything moved, so the caller can keep settling until
  // the pile is stable.
  function settle(grid) {
    let moved = false;
    for (let c = 0; c < COLS; c++) {
      for (let r = ROWS - 2; r >= 0; r--) {
        if (!grid[r][c]) continue;
        let nr = r;
        while (nr + 1 < ROWS && !grid[nr + 1][c]) nr++;
        if (nr !== r) { grid[nr][c] = grid[r][c]; grid[r][c] = null; moved = true; }
      }
    }
    return moved;
  }

  const columnTop = (grid, c) => {
    for (let r = 0; r < ROWS; r++) if (grid[r][c]) return r;
    return ROWS;
  };

  const buried = grid => {
    for (let c = 0; c < COLS; c++) if (grid[0][c]) return true;
    return false;
  };

  // ── miner ────────────────────────────────────────────────────
  // Walks the surface of the rubble: steps onto an empty tile, climbs a
  // single-tile ledge, and falls when nothing supports it.
  function minerMove(grid, miner, dc) {
    const nc = miner.c + dc;
    if (nc < 0 || nc >= COLS) return { moved: false, escaped: true, dir: dc };

    if (!grid[miner.r][nc]) return { moved: true, r: miner.r, c: nc };

    // something in the way — try to climb it
    const upR = miner.r - 1;
    if (upR >= 0 && !grid[upR][nc] && !grid[upR][miner.c]) {
      return { moved: true, r: upR, c: nc, climbed: true };
    }
    return { moved: false };
  }

  function minerFall(grid, miner) {
    let r = miner.r;
    while (r + 1 < ROWS && !grid[r + 1][miner.c]) r++;
    return r;
  }

  const crushed = (grid, miner) => !!grid[miner.r][miner.c];

  // ── scoring ──────────────────────────────────────────────────
  // Depth multiplies everything, so the same rock is worth more the
  // further in you are — which is what keeps a long run interesting.
  function scoreFor(destroyedTypes, level) {
    let s = 0;
    for (const t of destroyedTypes) s += ROCKS[t] ? ROCKS[t].score : 0;
    return Math.round(s * (1 + 0.15 * (level - 1)));
  }

  return {
    COLS, ROWS, ROCKS, MODES,
    difficulty, emptyGrid, inBounds, at, pickRockType, makeRock,
    applyImpact, detonate, settle, columnTop, buried,
    minerMove, minerFall, crushed, scoreFor,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = ENGINE;
