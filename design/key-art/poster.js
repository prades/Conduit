const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2] || path.join(__dirname, 'out/conduit-poster.png');
const A = {};   // assets: name -> { img, anchor, cell }
const add = (name, png, json) => { const m = json && fs.existsSync(json) ? JSON.parse(fs.readFileSync(json, 'utf8')) : null;
  A[name] = { img: 'data:image/png;base64,' + fs.readFileSync(png).toString('base64'), anchor: m ? m.anchor : null, g: fs.existsSync(png.replace('.png', '_g.png')) ? 'data:image/png;base64,' + fs.readFileSync(png.replace('.png', '_g.png')).toString('base64') : null }; };
const B = path.join(__dirname, 'out') + '/';   // what make.sh renders
for (const id of ['thunderhead', 'voidstar', 'rotshard', 'embercowl', 'rimestar', 'hornshell', 'jellyram', 'maw', 'hovershell', 'igloo', 'gooproxy', 'mimic', 'coralcrab', 'sundew', 'shrub', 'hammerslug']) add('sky_' + id, B + 'forms/' + id + '.png', B + 'forms/' + id + '.json');
for (const id of ['quillstone', 'staticorb', 'thermite', 'embercowl', 'seeper']) add('R_' + id, B + 'fightR/' + id + '.png', B + 'fightR/' + id + '.json');
for (const id of ['electroskink', 'blightspider', 'maw', 'rotshard']) add('L_' + id, B + 'fightL/' + id + '.png', B + 'fightL/' + id + '.json');
for (const f of [0, 1, 2, 6]) for (const id of ['player_gun_aim', 'player_mech', 'player_laser_aim', 'player_coat']) if (fs.existsSync(`${B}hero/f${f}/${id}.png`)) add(`h${f}_${id}`, `${B}hero/f${f}/${id}.png`, `${B}hero/f${f}/${id}.json`);
add('main_gun', B + 'main0/player_gun.png', B + 'main0/player_gun.json'); add('mantis', B + 'mantis.png'); add('hq', B + 'hq.png'); add('plant', B + 'plant.png');
const vm = require('vm'), ectx = {}; vm.createContext(ectx); vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/evolution.js'), 'utf8') + ';this.__E = EVOLUTIONS;', ectx);
const ECOL = { fire: '#ff4a1c', electric: '#ffe733', flux: '#a64dff', core: '#19e6c1', toxic: '#6dff5a', ice: '#8fe3ff', blossom: '#ff7ab8' };
for (const k in A) { const id = k.replace(/^(sky_|R_|L_|h\d_)/, ''); const e = ectx.__E[id]; A[k].col = e ? (ECOL[e.element] || '#19e6c1') : '#19e6c1'; }
const W = 2400, H = 3600;
const page = `<!doctype html><body style="margin:0"><canvas id=c width=${W} height=${H}></canvas><script>
const A = ${JSON.stringify(A)}, W = ${W}, H = ${H};
const L = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; });
window.done = (async () => {
for (const k in A) { A[k].im = await L(A[k].img); if (A[k].g) A[k].gim = await L(A[k].g); }
const c = document.getElementById('c'), g = c.getContext('2d');
let S = 7; const rnd = () => (S = (S * 16807) % 2147483647) / 2147483647;
const SANS = s => 'italic 900 ' + s + 'px "Inter", "DejaVu Sans", sans-serif';
const lin = (x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => gr.addColorStop(o, col)); return gr; };
const rad = (x, y, r0, r1, stops) => { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, col]) => gr.addColorStop(o, col)); return gr; };
const poly = (pts, fill) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = fill; g.fill(); };
// put an asset with its ground anchor at (x, y), scale k
const put = (n, x, y, k, o = {}) => { const a = A[n], w = a.im.width * k, h = a.im.height * k, ax = a.anchor ? a.anchor.x * k : w / 2, ay = a.anchor ? a.anchor.y * k : h;
  g.save(); if (o.alpha != null) g.globalAlpha = o.alpha; if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.blur || 30; } if (o.filter) g.filter = o.filter;
  if (o.flip) { g.translate(x, 0); g.scale(-1, 1); g.translate(-x, 0); } if (a.gim && !o.noGround) g.drawImage(a.gim, x - ax, y - ay, w, h); g.drawImage(a.im, x - ax, y - ay, w, h); g.restore(); };
const putLit = (n, x, y, k, o = {}) => { const a = A[n], col = o.col || a.col, w = Math.ceil(a.im.width * k), h = Math.ceil(a.im.height * k), ax = a.anchor ? a.anchor.x * k : w / 2, ay = a.anchor ? a.anchor.y * k : h;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const q = cv.getContext('2d'); if (o.flip) { q.translate(w, 0); q.scale(-1, 1); }
  if (a.gim && !o.noGround) q.drawImage(a.gim, 0, 0, w, h); q.drawImage(a.im, 0, 0, w, h);
  q.globalCompositeOperation = 'source-atop'; const gr = q.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, col + (o.wash || 'aa')); gr.addColorStop(0.55, col + '22'); gr.addColorStop(1, 'rgba(255,255,255,0.10)'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
  const ox = x - ax, oy = y - ay;
  g.save(); if (o.alpha != null) g.globalAlpha = o.alpha; g.shadowColor = col; g.shadowBlur = o.blur || 60; g.drawImage(cv, ox, oy); g.shadowBlur = (o.blur || 60) / 3; g.drawImage(cv, ox, oy);
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = (o.alpha != null ? o.alpha : 1) * 0.18; g.drawImage(cv, ox, oy); g.restore(); };
const shadow = (x, y, rx, ry, a) => { g.save(); g.fillStyle = 'rgba(0,0,0,' + (a || 0.55) + ')'; g.filter = 'blur(' + ry * 0.5 + 'px)'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); g.restore(); };
const glowAt = (x, y, r, col, a) => { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(x, y, 0, r, [[0, col.replace('A', a)], [1, col.replace('A', 0)]]); g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore(); };
const HZ = 1960;   // the horizon

// ── SKY ─────────────────────────────────────────────
g.fillStyle = lin(0, 0, 0, HZ, [[0, '#04060f'], [0.35, '#0b1430'], [0.62, '#2a1a3a'], [0.82, '#7a3326'], [1, '#d8642a']]); g.fillRect(0, 0, W, HZ + 40);
for (let i = 0; i < 420; i++) { const y = rnd() * 1100; g.fillStyle = 'rgba(220,235,255,' + (0.15 + rnd() * 0.6) * (1 - y / 1100) + ')'; g.fillRect(rnd() * W, y, 2 + rnd() * 2, 2 + rnd() * 2); }
glowAt(1860, 1500, 1300, 'rgba(255,110,40,A)', 0.35);   // the eruption lights the sky
glowAt(2250, 1850, 700, 'rgba(109,255,90,A)', 0.12);    // and the plant's leak
// ── THE PLUME (behind the volcano) ──
const VX = 1880, VY = 1470;   // the crater
for (let i = 0; i < 260; i++) { const t = rnd(), y = VY - t * 1100, x = VX + (rnd() - 0.5) * (120 + t * 900) + t * 260, r = 60 + t * 220 * rnd() + 40;
  g.fillStyle = 'rgba(' + Math.round(30 + 60 * (1 - t)) + ',' + Math.round(22 + 20 * (1 - t)) + ',' + Math.round(26 + 10 * (1 - t)) + ',' + (0.12 + 0.18 * (1 - t)) + ')'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
glowAt(VX, VY - 80, 520, 'rgba(255,120,40,A)', 0.55);
// ── THE SKY FEATURE: the main character large (top right), a few followers blown up, each on a plain highlight ──
const halo = (x, y, r, col, a) => { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(x, y, 0, r, [[0, col + a], [0.55, col + '22'], [1, col + '00']]); g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore(); };
const sky = [['sky_jellyram', 250, 700, 0.9, 520], ['sky_embercowl', 430, 900, 0.85, 520], ['sky_voidstar', 1080, 900, 1.35, 760]];
for (const [n, x, y, k, r] of sky) halo(x, y - 330 * k, r, A[n].col, '66');
halo(1870, 620, 900, '#19e6c1', '66'); halo(1870, 620, 460, '#bffff4', '30');
for (const [n, x, y, k] of sky) putLit(n, x, y, k, { noGround: true, blur: 60, alpha: 0.96, wash: '55' });
put('main_gun', 1880, 1080, 0.86, { flip: true, noGround: true, glow: '#19e6c1', blur: 70 }); put('main_gun', 1880, 1080, 0.86, { flip: true, noGround: true, glow: 'rgba(25,230,193,0.9)', blur: 22 });
// fade the base into the dusk
g.fillStyle = lin(0, 1150, 0, HZ, [[0, 'rgba(42,26,58,0)'], [0.6, 'rgba(110,45,40,0.45)'], [1, 'rgba(216,100,42,0.85)']]); g.fillRect(0, 1150, W, HZ - 1150);
// ── MOUNTAINS (low-poly: facets fanned from the peak, shaded by side) ──
const mountain = (peak, base, lit, dark, haze, crater) => { const [px, py] = peak, pts = base; const n = pts.length;
  for (let i = 0; i < n - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], mid = (x0 + x1) / 2; const side = mid < px ? 0 : 1; const v = 0.75 + rnd() * 0.5;
    const top = crater ? [[px - crater, py + 10], [px + crater, py + 10]] : [[px, py]];
    const col = side ? lit : dark; const cc = col.map(c => Math.min(255, Math.round(c * v)));
    poly([...(mid < px ? [top[0]] : [top[top.length - 1]]), [x0, y0], [x1, y1]], 'rgb(' + cc.join(',') + ')'); }
  g.fillStyle = lin(0, py, 0, pts[0][1], [[0, 'rgba(0,0,0,0)'], [1, haze]]); g.beginPath(); g.moveTo(px, py); pts.forEach(p => g.lineTo(...p)); g.closePath(); g.fill(); };
const ridge = (x0, x1, y, n, j) => { const r = []; for (let i = 0; i <= n; i++) r.push([x0 + (x1 - x0) * i / n, y + (rnd() - 0.5) * j]); return r; };
// far range
mountain([1100, 1560], ridge(500, 1700, HZ, 9, 40), [70, 52, 70], [40, 30, 52], 'rgba(150,70,50,0.55)');
// the giant mountain, left, snow on its head
mountain([560, 980], ridge(-500, 1500, HZ + 10, 14, 30), [92, 78, 96], [36, 34, 58], 'rgba(120,60,50,0.6)');
poly([[560, 980], [470, 1110], [520, 1090], [560, 1140], [610, 1095], [660, 1120]], 'rgba(220,225,240,0.85)'); poly([[560, 980], [610, 1095], [660, 1120]], 'rgba(150,160,190,0.9)');
// the volcano, right of the valley
mountain([VX, VY], ridge(1280, 2600, HZ + 10, 12, 20), [96, 54, 42], [38, 26, 30], 'rgba(120,50,30,0.45)', 70);
// lava: the fountain and the rivers down its flanks
g.save(); g.globalCompositeOperation = 'lighter';
for (let i = 0; i < 160; i++) { const a = -Math.PI / 2 + (rnd() - 0.5) * 1.1, v = 140 + rnd() * 380; const x = VX + Math.cos(a) * v * 0.9, y = VY - Math.sin(-a) * v * (0.6 + rnd() * 0.4);
  g.fillStyle = 'rgba(255,' + Math.round(140 + rnd() * 100) + ',60,' + (0.5 + rnd() * 0.5) + ')'; g.beginPath(); g.arc(x, y, 4 + rnd() * 9, 0, 7); g.fill(); }
const river = (pts, w) => { g.strokeStyle = 'rgba(255,120,30,0.9)'; g.lineWidth = w; g.lineJoin = 'round'; g.shadowColor = '#ff6a1c'; g.shadowBlur = 40; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.lineWidth = w * 0.4; g.strokeStyle = '#ffe2a0'; g.stroke(); };
river([[VX - 40, VY + 15], [VX - 110, VY + 140], [VX - 150, VY + 260], [VX - 240, VY + 420], [VX - 300, HZ - 10]], 14);
river([[VX + 30, VY + 15], [VX + 90, VY + 170], [VX + 70, VY + 300], [VX + 160, VY + 470]], 10);
river([[VX - 10, VY + 15], [VX - 20, VY + 180], [VX + 20, VY + 330]], 8);
g.restore();
glowAt(VX, VY, 260, 'rgba(255,200,90,A)', 0.8);
// ── THE VALLEY'S WATER ──
g.fillStyle = lin(0, HZ - 40, 0, HZ + 120, [[0, '#4a2a2a'], [1, '#120c18']]); g.beginPath(); g.moveTo(820, HZ + 6); g.quadraticCurveTo(1250, HZ - 30, 1700, HZ + 6); g.lineTo(1900, HZ + 110); g.lineTo(700, HZ + 110); g.closePath(); g.fill();
g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 70; i++) { const x = 1400 + (rnd() - 0.4) * 500, y = HZ + 10 + rnd() * 90; g.fillStyle = 'rgba(255,130,50,' + (0.15 + rnd() * 0.35) + ')'; g.fillRect(x, y, 30 + rnd() * 90, 3); }
for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(109,255,90,' + (0.08 + rnd() * 0.2) + ')'; g.fillRect(1650 + rnd() * 300, HZ + 30 + rnd() * 80, 20 + rnd() * 60, 3); } g.restore();
// ── THE POWER PLANT, its leak ──
put('plant', 2160, HZ + 130, 0.42, { filter: 'brightness(0.7) saturate(0.6)' });
g.fillStyle = rad(2150, 1960, 0, 420, [[0, 'rgba(150,70,50,0.3)'], [1, 'rgba(150,70,50,0)']]); g.fillRect(1730, 1540, 840, 840);
// steam from the towers
for (let i = 0; i < 70; i++) { const t = rnd(); g.fillStyle = 'rgba(200,190,200,' + 0.1 * (1 - t) + ')'; g.beginPath(); g.arc(2040 + (rnd() - 0.3) * 80 + t * 120, 1830 - t * 360, 30 + t * 80, 0, 7); g.fill(); }
// the leak: green sludge pouring from the broken pipe to a spreading pool
g.save(); g.globalCompositeOperation = 'lighter'; g.shadowColor = '#6dff5a'; g.shadowBlur = 40; g.strokeStyle = 'rgba(109,255,90,0.9)'; g.lineWidth = 12; g.beginPath(); g.moveTo(2208, 2005); g.quadraticCurveTo(2190, 2050, 2150, 2075); g.stroke();
g.fillStyle = 'rgba(109,255,90,0.55)'; g.beginPath(); g.ellipse(2110, 2085, 190, 26, 0, 0, 7); g.fill(); g.restore();
glowAt(2150, 2070, 360, 'rgba(109,255,90,A)', 0.35);
// ── THE CITY GROUND ──
g.fillStyle = lin(0, HZ + 60, 0, 2620, [[0, '#7a4636'], [0.35, '#4a2e36'], [0.75, '#2a2230'], [1, '#1a1922']]); g.fillRect(0, HZ + 90, W, 2620 - HZ);
// low-poly foothills between the horizon and the street, lit by the eruption from the right
for (let band = 0; band < 3; band++) { const y0 = HZ + 70 + band * 120, amp = 70 + band * 30; const pts = []; for (let x = -100; x <= W + 340; x += 220) pts.push([x, y0 - (0.5 + 0.5 * Math.sin(x / 300 + band * 2)) * amp - rnd() * 25]);
  for (let i = 0; i < pts.length - 1; i++) { const [x0, a0] = pts[i], [x1, a1] = pts[i + 1]; const lit = 0.65 + 0.35 * (x0 / W) + (rnd() - 0.5) * 0.15, dk = [96, 58, 52].map(v => Math.round(v * lit * (1 - band * 0.18)));
    poly([[x0, a0], [x1, a1], [x1, y0 + 260], [x0, y0 + 260]], 'rgb(' + dk.join(',') + ')'); poly([[x0, a0], [x1, a1], [(x0 + x1) / 2, y0 + 60]], 'rgba(255,150,90,' + (0.03 + 0.05 * x0 / W) + ')'); } }
g.fillStyle = lin(0, HZ, 0, HZ + 160, [[0, 'rgba(216,100,42,0.55)'], [1, 'rgba(216,100,42,0)']]); g.fillRect(0, HZ, W, 160);
// ── THE HQ ──
glowAt(640, 2050, 800, 'rgba(25,230,193,A)', 0.2);
put('hq', 600, 2560, 0.78);
// ── THE STREET (perspective), the broken sewer ──
const blendStreet = () => { g.fillStyle = lin(0, 2380, 0, 2760, [[0, 'rgba(26,25,34,0)'], [1, 'rgba(18,17,25,0.9)']]); g.fillRect(0, 2380, W, 380); };
const VP = [1250, 2380];
poly([[-200, H], [W + 200, H], [VP[0] + 320, VP[1]], [VP[0] - 320, VP[1]]], lin(0, VP[1], 0, H, [[0, '#191822'], [0.5, '#121119'], [1, '#07070b']]));
poly([[-200, H], [-200, 3100], [VP[0] - 320, VP[1]], [VP[0] - 360, VP[1]]], '#22222c'); poly([[W + 200, H], [W + 200, 3100], [VP[0] + 320, VP[1]], [VP[0] + 360, VP[1]]], '#22222c');
g.strokeStyle = 'rgba(255,204,68,0.5)'; for (let i = 0; i < 9; i++) { const t0 = Math.pow(i / 9, 2), t1 = Math.pow((i + 0.45) / 9, 2); const y0 = VP[1] + (H - VP[1]) * t0, y1 = VP[1] + (H - VP[1]) * t1; g.lineWidth = 3 + 30 * t0; g.beginPath(); g.moveTo(VP[0], y0); g.lineTo(VP[0], y1); g.stroke(); }
blendStreet();
// cracks
g.strokeStyle = 'rgba(0,0,0,0.75)'; for (let i = 0; i < 46; i++) { let x = 1500 + (rnd() - 0.5) * 1700, y = 2700 + (rnd() - 0.4) * 500; g.lineWidth = 2 + rnd() * 5; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rnd() - 0.5) * 140; y += (rnd() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
// the hole
const HX = 1520, HY = 2760;
glowAt(HX, HY - 300, 900, 'rgba(109,255,90,A)', 0.28);
g.fillStyle = '#020403'; g.beginPath(); for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, r = 1 + (rnd() - 0.5) * 0.18; g.lineTo(HX + Math.cos(a) * 520 * r, HY + Math.sin(a) * 150 * r); } g.closePath(); g.fill();
g.fillStyle = rad(HX, HY, 20, 480, [[0, 'rgba(109,255,90,0.75)'], [0.5, 'rgba(40,140,40,0.35)'], [1, 'rgba(0,0,0,0)']]); g.beginPath(); g.ellipse(HX, HY, 470, 130, 0, 0, 7); g.fill();
// ── THE MANTIS, rising out of it ──
put('mantis', HX - 40, HY + 640, 1.42, { glow: 'rgba(109,255,90,0.5)', blur: 60 });
// the hole's front lip and broken pipes, over the mantis
g.fillStyle = '#16161e'; g.beginPath(); g.moveTo(HX - 560, HY); for (let i = 0; i <= 20; i++) { const a = Math.PI * i / 20; g.lineTo(HX - Math.cos(a) * 540 * (1 + (rnd() - 0.5) * 0.1), HY + Math.sin(a) * 150 + (rnd() - 0.5) * 24); } g.lineTo(HX + 560, HY + 260); g.lineTo(HX - 560, HY + 260); g.closePath(); g.fill();
g.strokeStyle = '#000'; g.lineWidth = 4; g.stroke();
const pipeEnd = (x, y, r, a) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = lin(0, -r, 0, r, [[0, '#4a4e58'], [0.5, '#2a2c34'], [1, '#14151a']]); g.fillRect(-r * 3, -r, r * 3, 2 * r); g.fillStyle = '#0a0a0e'; g.beginPath(); g.ellipse(0, 0, r * 0.35, r, 0, 0, 7); g.fill(); g.strokeStyle = '#6a6e78'; g.lineWidth = 6; g.stroke(); g.restore(); };
pipeEnd(HX - 420, HY + 30, 46, -0.25); pipeEnd(HX + 470, HY + 10, 40, Math.PI + 0.3);
// toxic water gushing out of the pipes and the hole
g.save(); g.globalCompositeOperation = 'lighter'; g.shadowColor = '#6dff5a'; g.shadowBlur = 30;
for (let i = 0; i < 220; i++) { const left = i % 2, t = rnd(); const x0 = left ? HX - 420 : HX + 470, y0 = left ? HY + 30 : HY + 10; const x = x0 + (left ? 1 : -1) * t * 160 + (rnd() - 0.5) * 30, y = y0 + t * t * 140 + (rnd() - 0.5) * 20;
  g.fillStyle = 'rgba(' + Math.round(80 + rnd() * 80) + ',255,' + Math.round(70 + rnd() * 50) + ',' + (0.3 + rnd() * 0.5) + ')'; g.beginPath(); g.arc(x, y, 3 + rnd() * 8, 0, 7); g.fill(); }
for (let i = 0; i < 90; i++) { const a = -Math.PI / 2 + (rnd() - 0.5) * 2.4, v = rnd() * 380; g.fillStyle = 'rgba(140,255,120,' + (0.25 + rnd() * 0.5) + ')'; g.beginPath(); g.arc(HX + Math.cos(a) * v * 1.3, HY - 20 + Math.sin(a) * v * 0.7, 2 + rnd() * 6, 0, 7); g.fill(); }
g.restore();
// toxic puddles in the street
g.save(); g.globalCompositeOperation = 'lighter'; [[HX - 650, HY + 230, 200], [HX + 600, HY + 300, 240], [HX + 80, HY + 330, 300]].forEach(([x, y, r]) => { g.fillStyle = rad(x, y, 0, r, [[0, 'rgba(109,255,90,0.45)'], [1, 'rgba(109,255,90,0)']]); g.beginPath(); g.ellipse(x, y, r, r * 0.22, 0, 0, 7); g.fill(); }); g.restore();
// rubble chunks
for (let i = 0; i < 40; i++) { const x = HX + (rnd() - 0.5) * 1500, y = HY + 120 + rnd() * 380, s = 14 + rnd() * 40; const pts = []; for (let k = 0; k < 5; k++) { const a = k / 5 * 7 + rnd(); pts.push([x + Math.cos(a) * s, y + Math.sin(a) * s * 0.6]); } poly(pts, 'rgb(' + [44, 44, 54].map(v => Math.round(v * (0.6 + rnd() * 0.8))).join(',') + ')'); }
// ── THE BATTLE ──
const beam = (x0, y0, x1, y1, col, w) => { g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.shadowColor = col; g.shadowBlur = 50; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.shadowBlur = 0; g.strokeStyle = '#ffffff'; g.lineWidth = w * 0.35; g.stroke(); g.restore(); glowAt(x1, y1, 120, 'rgba(255,255,255,A)', 0.5); };
const bolt = (x0, y0, x1, y1, col) => { g.save(); g.globalCompositeOperation = 'lighter'; g.shadowColor = col; g.shadowBlur = 30; g.strokeStyle = col; g.lineWidth = 6; g.beginPath(); g.moveTo(x0, y0); for (let i = 1; i < 10; i++) { const t = i / 10; g.lineTo(x0 + (x1 - x0) * t + (rnd() - 0.5) * 70, y0 + (y1 - y0) * t + (rnd() - 0.5) * 70); } g.lineTo(x1, y1); g.stroke(); g.restore(); };
// left: the gunner, Quillstone, Static Orb, Thermite Burrower, Ember Hood
shadow(600, 3080, 170, 30); put('h6_player_gun_aim', 600, 3070, 0.66, { glow: 'rgba(25,230,193,0.6)', blur: 30 });
beam(805, 2885, 1470, 2050, '#19e6c1', 16);
shadow(330, 2900, 150, 26); put('R_quillstone', 330, 2890, 0.5, { glow: 'rgba(255,74,28,0.7)', blur: 30 });
for (let i = 0; i < 5; i++) { const a = -0.55 + i * 0.07; g.save(); g.translate(420 + i * 130, 2700 - i * 70); g.rotate(a); g.fillStyle = '#ff6a2c'; g.shadowColor = '#ff4a1c'; g.shadowBlur = 25; g.beginPath(); g.moveTo(40, 0); g.lineTo(-30, -9); g.lineTo(-30, 9); g.closePath(); g.fill(); g.restore(); }
shadow(820, 2700, 110, 20); put('R_staticorb', 820, 2690, 0.4, { glow: 'rgba(255,231,51,0.7)', blur: 30 });
bolt(900, 2600, 1300, 2420, '#ffe733'); bolt(910, 2620, 1320, 2380, '#fff6a0');
shadow(1000, 3140, 120, 22); put('R_thermite', 1000, 3130, 0.42, { glow: 'rgba(255,74,28,0.6)', blur: 24 });
shadow(150, 2700, 100, 18); put('R_embercowl', 150, 2690, 0.34, { glow: 'rgba(255,74,28,0.6)', blur: 24 });
g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(1180, 2560, 0, 90, [[0, 'rgba(255,240,180,1)'], [0.4, 'rgba(255,120,30,0.9)'], [1, 'rgba(255,60,20,0)']]); g.beginPath(); g.arc(1180, 2560, 90, 0, 7); g.fill();
g.strokeStyle = 'rgba(255,110,30,0.35)'; g.lineWidth = 50; g.lineCap = 'round'; g.beginPath(); g.moveTo(210, 2650); g.quadraticCurveTo(650, 2520, 1140, 2560); g.stroke(); g.restore();
// right: the laser, Blight Spider, Electro Skink, Frost Maw, Rotshard
shadow(1960, 3080, 170, 30); put('h6_player_laser_aim', 1960, 3070, 0.66, { glow: 'rgba(25,230,193,0.6)', blur: 30, flip: true });
beam(1752, 2900, 1600, 1980, '#8fe3ff', 14);
shadow(2200, 2860, 150, 26); put('L_blightspider', 2200, 2850, 0.46, { glow: 'rgba(109,255,90,0.6)', blur: 30 });
shadow(1830, 2700, 110, 18); put('L_electroskink', 1830, 2690, 0.4, { glow: 'rgba(255,231,51,0.6)', blur: 24 });
bolt(1760, 2620, 1600, 2300, '#ffe733');
shadow(2250, 3110, 170, 30); put('L_maw', 2250, 3100, 0.5, { glow: 'rgba(143,227,255,0.6)', blur: 30 });
g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 60; i++) { const t = rnd(); g.fillStyle = 'rgba(180,240,255,' + (0.3 + rnd() * 0.5) + ')'; g.beginPath(); g.arc(2150 - t * 450 + (rnd() - 0.5) * 60, 2990 - t * 420 + (rnd() - 0.5) * 60, 4 + rnd() * 10, 0, 7); g.fill(); } g.restore();
// ── GRADE: warm from the right, toxic from below, vignette, the title band ──
g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = lin(W, 0, 0, H, [[0, 'rgba(255,140,60,0.5)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(25,230,193,0.35)']]); g.fillRect(0, 0, W, H); g.restore();
g.fillStyle = rad(W / 2, H * 0.45, W * 0.45, W * 1.05, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.7)']]); g.fillRect(0, 0, W, H);
g.fillStyle = lin(0, 3300, 0, H, [[0, 'rgba(4,5,10,0)'], [0.35, 'rgba(4,5,10,0.85)'], [1, 'rgba(4,5,10,1)']]); g.fillRect(0, 3300, W, H - 3300);
g.fillStyle = lin(0, 0, 0, 260, [[0, 'rgba(4,5,10,0.85)'], [1, 'rgba(4,5,10,0)']]); g.fillRect(0, 0, W, 260);
// ── TYPE ──
const txt = (s, x, y, font, fill, glow, blur, ls) => { g.save(); g.font = font; g.textAlign = 'center'; if (ls) g.letterSpacing = ls; g.shadowColor = glow || 'transparent'; g.shadowBlur = blur || 0; g.fillStyle = fill; g.fillText(s, x, y); if (blur) { g.shadowBlur = blur / 3; g.fillText(s, x, y); } g.restore(); };
txt('THE SEWERS WERE ONLY THE BEGINNING.', W / 2, 130, 'bold 46px "DejaVu Sans Mono", monospace', '#cfe9f2', '#19e6c1', 10, '8px');
txt('CONDUIT', W / 2, 3420, SANS(330), lin(0, 3150, 0, 3430, [[0, '#ffffff'], [0.55, '#bff8ff'], [1, '#19e6c1']]), '#19e6c1', 70);
txt('C.O.R.E.  STRATEGY', W / 2, 3500, SANS(64), '#ffffff', '#19e6c1', 20, '14px');
txt('COMBAT  ·  OPERATIONS  ·  ROGUELITE  ·  EVOLUTIONS', W / 2, 3565, 'bold 30px "DejaVu Sans Mono", monospace', '#7fa7b5', null, 0, '6px');
return true; })();
</script></body>`;
(async () => { const b = await chromium.launch({ args: ['--no-sandbox'] }); const p = await b.newPage({ viewport: { width: 800, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.setContent(page); await p.evaluate(() => window.done);
  const d = await p.evaluate(() => document.getElementById('c').toDataURL('image/png')); fs.writeFileSync(OUT, Buffer.from(d.split(',')[1], 'base64')); console.log('ok', errs.slice(0, 3)); await b.close(); })();
