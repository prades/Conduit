// THE TOP-DOWN PLAN of part of the sewer dungeon, from trace.js (the owner, 2026-11-22: "this is an excellent format"): node design/sewer-dungeon/planpic.js x0 y0 tiles out.png [labels as JSON: [[text, x, y], ...]] (needs ImageMagick)
const t = require('/home/user/Conduit/design/sewer-dungeon/trace.js'), { execFileSync } = require('child_process');
const [ox, oy, n, out] = [+process.argv[2], +process.argv[3], +process.argv[4], process.argv[5]], T = 760 / n;
const col = { water: '#1f9fb4', drain: '#2a7f96', walk: '#8a949b', floor: '#5a646c', ring: '#8a949b', nest: '#6a3f86', upper: '#7a6a3a', steps: '#8a949b' };
const inV = q => q[0] >= ox - 2 && q[0] <= ox + n + 2 && q[1] >= oy - 2 && q[1] <= oy + n + 2;
let d = t.SHAPES.filter(s => s.p.some(inV)).map(s => 'fill ' + col[s.kind] + ' stroke #0b0f16 stroke-width 2 polygon ' + s.p.map(q => ((q[0] - ox) * T).toFixed(0) + ',' + ((q[1] - oy) * T).toFixed(0)).join(' ')).join(' ');
const lab = JSON.parse(process.argv[6] || '[]');
d += ' ' + lab.map(l => 'fill white stroke none text ' + ((l[1] - ox) * T - 40).toFixed(0) + ',' + ((l[2] - oy) * T).toFixed(0) + ' "' + l[0] + '"').join(' ');
for (const v of t.VALVES) if (inV(v.at)) d += ' fill #ffd34a stroke none circle ' + ((v.at[0] - ox) * T) + ',' + ((v.at[1] - oy) * T) + ' ' + ((v.at[0] - ox) * T + 7) + ',' + ((v.at[1] - oy) * T);
execFileSync('convert', ['-size', '760x760', 'xc:#0b0f16', '-font', 'DejaVu-Sans-Bold', '-pointsize', '15', '-draw', d, out]);
