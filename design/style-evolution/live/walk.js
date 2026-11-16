// WHERE ONE CAN WALK, AND THE WAY THERE (design/style-evolution/live; the live test page, lab3d/, not the game). The lab floor's tiles (floor.js) as a grid: the way from one
// tile to another (A*, eight ways, never across a corner or a thin wall), then pulled straight wherever the straight line is clear. It is the test page's own: the game finds its
// ways with js/facility.js (facilityCanStep and its routes round the walls), which this does not use.
function makeWalk(world) {
  const K = cellKey, ok = (x, y) => world.walkable(x, y), edge = (x0, y0, x1, y1) => world.edges.has(K(x0, y0) + '|' + K(x1, y1)) || world.edges.has(K(x1, y1) + '|' + K(x0, y0));
  // one step, tile to tile: onto a tile one can stand on; a slanting step only past two free tiles (never across a corner); never through a thin wall
  const step = (x0, y0, x1, y1) => { if (!ok(x1, y1)) return false; const dx = x1 - x0, dy = y1 - y0; if (!dx || !dy) return !edge(x0, y0, x1, y1);
    return ok(x0 + dx, y0) && ok(x0, y0 + dy) && !edge(x0, y0, x0 + dx, y0) && !edge(x0 + dx, y0, x1, y1) && !edge(x0, y0, x0, y0 + dy) && !edge(x0, y0 + dy, x1, y1); };
  // the tiles from one tile to another (both ends in it), or null
  function path(from, to) {
    if (!ok(from[0], from[1]) || !ok(to[0], to[1])) return null; const sk = K(from[0], from[1]), tk = K(to[0], to[1]); if (sk === tk) return [[from[0], from[1]]];
    const open = [{ x: from[0], y: from[1], g: 0, f: 0, k: sk, p: null }], best = new Map([[sk, 0]]), done = new Set();
    while (open.length) { let bi = 0; for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i; const n = open[bi]; open[bi] = open[open.length - 1]; open.pop(); if (done.has(n.k)) continue; done.add(n.k);
      if (n.k === tk) { const out = []; for (let q = n; q; q = q.p) out.push([q.x, q.y]); return out.reverse(); }
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { if (!dx && !dy) continue; const x = n.x + dx, y = n.y + dy, k = K(x, y); if (done.has(k) || !step(n.x, n.y, x, y)) continue;
        const g = n.g + (dx && dy ? 1.4142 : 1); if (best.has(k) && best.get(k) <= g) continue; best.set(k, g); const hx = Math.abs(to[0] - x), hy = Math.abs(to[1] - y); open.push({ x, y, g, f: g + Math.max(hx, hy) + 0.4142 * Math.min(hx, hy), k, p: n }); } }
    return null;
  }
  // is the straight line from a to b free for a body r wide each side? (points, not tiles)
  function clear(a, b, r) {
    r = r === undefined ? 0.3 : r; const d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d < 1e-6) return ok(Math.round(a[0]), Math.round(a[1])); const n = Math.ceil(d / 0.2), px = -(b[1] - a[1]) / d * r, py = (b[0] - a[0]) / d * r; let lx = 0, ly = 0, has = false;
    for (let i = 0; i <= n; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; if (!ok(Math.round(x + px), Math.round(y + py)) || !ok(Math.round(x - px), Math.round(y - py))) return false;
      const cx = Math.round(x), cy = Math.round(y); if (has && (cx !== lx || cy !== ly) && !step(lx, ly, cx, cy)) return false; lx = cx; ly = cy; has = true; }
    return true;
  }
  const standable = p => clear(p, p) && [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]].every(o => ok(Math.round(p[0] + o[0]), Math.round(p[1] + o[1])));
  // the nearest tile one can stand on to a point, within r tiles (the point's own tile first)
  function nearest(p, r) { r = r === undefined ? 2 : r; const cx = Math.round(p[0]), cy = Math.round(p[1]); if (ok(cx, cy)) return [cx, cy]; let best = null, bd = 1e9; const R = Math.ceil(r);
    for (let x = cx - R; x <= cx + R; x++) for (let y = cy - R; y <= cy + R; y++) if (ok(x, y)) { const d = Math.hypot(x - p[0], y - p[1]); if (d < bd && d <= r + 0.71) { bd = d; best = [x, y]; } } return best; }
  const smooth = pts => { if (pts.length < 3) return pts; const out = [pts[0]]; let i = 0; while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !clear(pts[i], pts[j])) j--; out.push(pts[j]); i = j; } return out; };
  // the points to walk through from a point to a point (the first is `from` itself), or null when there is no way. It ends on the very point asked for when one can stand there
  function route(from, to, r) { const a = nearest(from, 1.6), b = nearest(to, r === undefined ? 2.5 : r); if (!a || !b) return null; const p = path(a, b); if (!p) return null;
    const pts = [[from[0], from[1]]].concat(p.map(c => [c[0], c[1]])); if (Math.round(to[0]) === b[0] && Math.round(to[1]) === b[1] && standable(to)) pts.push([to[0], to[1]]); return smooth(pts); }
  const length = pts => { let d = 0; for (let i = 0; i + 1 < pts.length; i++) d += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); return d; };
  return { ok, step, path, clear, standable, nearest, smooth, route, length };
}
