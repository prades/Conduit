// ═══════════════════════════════════════════════════════════════
//  WORDFALL — grid logic
//
//  Kept free of DOM so the rules can be tested directly: word finding,
//  gravity, and scoring are pure functions over a grid.
//
//  A grid is an array of ROWS arrays of COLS entries, each either null
//  (empty) or a single uppercase letter. Row 0 is the top.
// ═══════════════════════════════════════════════════════════════
const ENGINE = (function () {
  'use strict';

  const COLS = 7, ROWS = 13;
  const MIN_WORD = 3;

  // Scrabble-ish values, but the bag below is deliberately vowel-heavy:
  // a faithful Scrabble distribution leaves you unable to build anything
  // when only seven columns are in play.
  const VALUES = {
    A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,
    N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10,
  };

  const BAG = (
    'A'.repeat(11) + 'E'.repeat(14) + 'I'.repeat(10) + 'O'.repeat(10) + 'U'.repeat(5) +
    'R'.repeat(8)  + 'T'.repeat(8)  + 'N'.repeat(7)  + 'S'.repeat(8)  + 'L'.repeat(6) +
    'D'.repeat(5)  + 'C'.repeat(4)  + 'M'.repeat(3)  + 'P'.repeat(3)  + 'G'.repeat(3) +
    'H'.repeat(3)  + 'B'.repeat(2)  + 'F'.repeat(2)  + 'K'.repeat(2)  + 'W'.repeat(2) +
    'Y'.repeat(2)  + 'V' + 'J' + 'X' + 'Z' + 'Q'
  ).split('');

  const emptyGrid = () =>
    Array.from({ length: ROWS }, () => new Array(COLS).fill(null));

  const randomLetter = (rnd) => BAG[Math.floor((rnd || Math.random)() * BAG.length)];

  // Collect every maximal run of adjacent letters, then test each of its
  // contiguous sub-runs. Longest first, so LEARN is preferred over EARN.
  function scanLine(cells, dict, found) {
    let run = [];
    const flush = () => {
      if (run.length >= MIN_WORD) {
        for (let len = run.length; len >= MIN_WORD; len--) {
          for (let s = 0; s + len <= run.length; s++) {
            const slice = run.slice(s, s + len);
            const word = slice.map(c => c.ch).join('').toLowerCase();
            if (dict.has(word)) found.push({ word, cells: slice });
          }
        }
      }
      run = [];
    };
    for (const c of cells) {
      if (c.ch) run.push(c); else flush();
    }
    flush();
  }

  // Returns every word currently spelled on the grid, plus the set of cell
  // keys they occupy. Overlapping words all count and all clear together.
  function findWords(grid, dict) {
    const found = [];
    for (let r = 0; r < ROWS; r++) {
      scanLine(grid[r].map((ch, c) => ({ ch, r, c })), dict, found);
    }
    for (let c = 0; c < COLS; c++) {
      const col = [];
      for (let r = 0; r < ROWS; r++) col.push({ ch: grid[r][c], r, c });
      scanLine(col, dict, found);
    }

    // A shorter word wholly inside a longer one on the same line is not a
    // separate find — it clears as part of the longer one.
    const keep = [];
    for (const f of found) {
      const inside = found.some(o =>
        o !== f && o.word.length > f.word.length &&
        f.cells.every(fc => o.cells.some(oc => oc.r === fc.r && oc.c === fc.c)));
      if (!inside) keep.push(f);
    }

    const cells = new Set();
    for (const f of keep) for (const c of f.cells) cells.add(c.r + ',' + c.c);
    return { words: keep, cells };
  }

  // Remove the given cells and let everything above fall into the gaps.
  function clearAndCollapse(grid, cells) {
    for (const key of cells) {
      const [r, c] = key.split(',').map(Number);
      grid[r][c] = null;
    }
    for (let c = 0; c < COLS; c++) {
      let write = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (grid[r][c] !== null) {
          const v = grid[r][c];
          grid[r][c] = null;
          grid[write][c] = v;
          write--;
        }
      }
    }
    return grid;
  }

  // Longer words are worth disproportionately more, and each extra link in
  // a chain reaction multiplies the whole clear.
  function scoreFor(words, chain) {
    let total = 0;
    for (const w of words) {
      const letters = w.word.toUpperCase().split('')
        .reduce((s, ch) => s + (VALUES[ch] || 1), 0);
      const lengthBonus = Math.pow(w.word.length - 1, 2);
      total += letters * lengthBonus;
    }
    return Math.round(total * (1 + 0.5 * Math.max(0, chain - 1)));
  }

  const canPlace = (grid, r, c) =>
    r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c] === null;

  // Where a tile in this column comes to rest.
  function dropRow(grid, c, fromRow) {
    let r = Math.max(0, fromRow);
    while (r + 1 < ROWS && grid[r + 1][c] === null) r++;
    return r;
  }

  return {
    COLS, ROWS, MIN_WORD, VALUES, BAG,
    emptyGrid, randomLetter, findWords, clearAndCollapse, scoreFor,
    canPlace, dropRow,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = ENGINE;
