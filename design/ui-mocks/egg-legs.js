// node design/ui-mocks/egg-glass.js <sheets-dir> <current-egg.png> <out.png> : the numbered options sheet for the clear-glass egg body (baked by design/evolutions/bake.js, ids eg_*): four facings idle, four walk frames, and
// the same at the size it is drawn in the game. <sheets-dir> holds eg_clear.png ... eg_capsule.png and eg_clear_ice.png; <current-egg.png> is the shell egg it replaces the body of.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [DIR, CUR, OUT] = [process.argv[2], process.argv[3], process.argv[4] || '/tmp/egg-glass.png'];
const items = [['1', 'INSECT', 'Armoured thigh and shin, a faceted knee, a pad foot with a pinprick of lit trim. The closest to the old legs, in metal.', 'lg_insect'], ['2', 'STRUTS', 'Piston thighs with a rod inside, shin rods, clamp cuffs at the knee, flat disc feet.', 'lg_strut'],
  ['3', 'SPIDER', 'Four thin plated legs ending in spikes: a wider, lighter stance.', 'lg_spider'], ['4', 'PISTONS', 'Short heavy hydraulic legs with wide armoured feet: it stands like a machine.', 'lg_piston'],
  ['5', 'SCYTHES', 'Bladed legs that curve out and up, then down to a point: sharp and a little dangerous.', 'lg_scythe'], ['6', 'CRAB', 'Six short plated legs walking in two sets of three: low and steady.', 'lg_crab'], ['NOW', 'THE OLD PINS', 'The thin black pins with glowing feet it has today (clear glass body, No. 1).', 'cur']];
const data = {}; items.forEach(i => { const f = i[3] === 'cur' ? CUR : DIR + '/' + i[3] + '.png'; data[i[3]] = 'data:image/png;base64,' + fs.readFileSync(f).toString('base64'); });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 2020, height: 1280 } }); await p.setContent('<body style="margin:0"><canvas id=c width=2020 height=1280></canvas>');
  const png = await p.evaluate(async ([items, data]) => {
    const c = document.getElementById('c'), x = c.getContext('2d'); x.fillStyle = '#070a14'; x.fillRect(0, 0, 2020, 1280);
    const load = u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; });
    x.fillStyle = '#ffe733'; x.font = 'italic 900 40px sans-serif'; x.fillText('CLEAR GLASS EGG: SIX SETS OF DARK METAL LEGS', 24, 50); x.fillStyle = '#8aa0c8'; x.font = 'bold 17px monospace'; x.fillText('THE CLEAR GLASS BODY (NO. 1) STAYS, WITH THE CRYSTAL INSIDE. ONLY THE LEGS CHANGE: DARK FACETED METAL, A PINPRICK OF LIT TRIM. PICK A NUMBER.', 24, 80);
    const cx0 = 32, cy0 = 20, cw = 80, ch = 112, Z = 1.95, W = cw * Z, H = ch * Z, PW = 480, PH = 560;
    for (let n = 0; n < items.length; n++) {
      const [no, name, note, id] = items[n], img = await load(data[id]); const col = n % 4, row = Math.floor(n / 4), ox = 20 + col * (PW + 18), oy = 100 + row * (PH + 18);
      x.fillStyle = '#0d1226'; x.fillRect(ox, oy, PW, PH); x.strokeStyle = n === 6 ? '#8aa0c8' : '#19e6c1'; x.lineWidth = 2; x.strokeRect(ox, oy, PW, PH);
      x.fillStyle = n === 6 ? '#8aa0c8' : '#ffe733'; x.font = 'italic 900 ' + (no.length > 1 ? 34 : 56) + 'px sans-serif'; x.fillText(no, ox + 14, oy + 54); x.fillStyle = '#fff'; x.font = 'italic 900 22px sans-serif'; x.fillText(name, ox + (no.length > 1 ? 100 : 66), oy + 50);
      [1, 3, 7].forEach((r, i) => x.drawImage(img, cx0, r * 144 + cy0, cw, ch, ox + 6 + i * 158, oy + 66, W * 1.07, H * 1.07));
      x.fillStyle = '#8aa0c8'; x.font = 'bold 13px monospace'; x.fillText('THREE FACINGS, IDLE', ox + 14, oy + 66 + H * 1.07 + 6);
      [8, 11, 14].forEach((f, i) => x.drawImage(img, f * 144 + cx0, 1 * 144 + cy0, cw, ch, ox + 8 + i * 84, oy + 340, cw * 1.15, ch * 1.15));
      x.fillText('WALKING', ox + 14, oy + 340 + ch * 1.15 + 14);
      x.drawImage(img, 0 * 144 + cx0, 1 * 144 + cy0, cw, ch, ox + PW - 96, oy + 350, cw, ch); x.font = 'bold 12px monospace'; x.fillText('IN GAME', ox + PW - 90, oy + 350 + ch + 14);
      x.fillStyle = '#b4c2e0'; x.font = 'bold 13px monospace'; const words = note.split(' '); let line = '', yy = oy + PH - 40; for (const w of words) { if ((line + w).length > 54) { x.fillText(line, ox + 14, yy); yy += 16; line = ''; } line += w + ' '; } x.fillText(line, ox + 14, yy);
    }
    return c.toDataURL('image/png');
  }, [items, data]);
  fs.writeFileSync(OUT, Buffer.from(png.split(',')[1], 'base64')); await b.close(); console.log('wrote', OUT);
})();
