// which pieces of the trace share a wall (an edge of one lying along an edge of another, a tile or more of it): where a doorway or a flight can go. node joins.js lists them, and the pieces
// that touch nothing (the trace must be mended there before it can be built)
const { SHAPES, STAIRS } = require('./trace.js');
function shared(A, B) { const out = [];
  for (let i = 0; i < A.length; i++) { const a0 = A[i], a1 = A[(i + 1) % A.length], dx = a1[0] - a0[0], dy = a1[1] - a0[1], L = Math.hypot(dx, dy); if (L < 0.5) continue; const ux = dx / L, uy = dy / L;
    for (let j = 0; j < B.length; j++) { const b0 = B[j], b1 = B[(j + 1) % B.length];
      const d0 = Math.abs((b0[0] - a0[0]) * uy - (b0[1] - a0[1]) * ux), d1 = Math.abs((b1[0] - a0[0]) * uy - (b1[1] - a0[1]) * ux); if (d0 > 0.08 || d1 > 0.08) continue;
      const t0 = (b0[0] - a0[0]) * ux + (b0[1] - a0[1]) * uy, t1 = (b1[0] - a0[0]) * ux + (b1[1] - a0[1]) * uy, lo = Math.max(0, Math.min(t0, t1)), hi = Math.min(L, Math.max(t0, t1));
      if (hi - lo >= 1) out.push({ a: [+(a0[0] + ux * lo).toFixed(2), +(a0[1] + uy * lo).toFixed(2)], b: [+(a0[0] + ux * hi).toFixed(2), +(a0[1] + uy * hi).toFixed(2)], len: +(hi - lo).toFixed(2) }); } }
  return out; }
function joins() { const out = []; for (let i = 0; i < SHAPES.length; i++) for (let j = i + 1; j < SHAPES.length; j++) for (const s of shared(SHAPES[i].p, SHAPES[j].p)) out.push({ rooms: [SHAPES[i].id, SHAPES[j].id], lv: [SHAPES[i].lvl, SHAPES[j].lvl], ...s }); return out; }
module.exports = { joins, shared };
if (require.main === module) { const J = joins(), seen = new Set(); for (const j of J) { seen.add(j.rooms[0]); seen.add(j.rooms[1]); console.log(j.rooms.join(' | ').padEnd(40), 'lv', j.lv.join('→').padEnd(6), 'len', String(j.len).padEnd(6), JSON.stringify(j.a), JSON.stringify(j.b)); }
  console.log('\nTOUCH NOTHING:', SHAPES.filter(s => !seen.has(s.id)).map(s => s.id).join(', ') || 'none'); }
