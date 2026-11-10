const scene = new T.Scene();
const cam = new T.PerspectiveCamera(30, W / H, 0.1, 300);
cam.position.set(-16, 4, 42); cam.lookAt(0, 8, 0);
scene.add(new T.HemisphereLight(0x6a80a0, 0x101418, 0.5));
const key = new T.DirectionalLight(0xffa060, 1.4); key.position.set(20, 10, 8); scene.add(key);
const fill = new T.DirectionalLight(0x4a9cff, 0.5); fill.position.set(-15, 6, 12); scene.add(fill);
// the facade: glass panes, a few lit rooms, mullions; dusk sky reflected at the top of each floor
const facade = (cols, rows, w, h, seed) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  let s = seed; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const cw = w / cols, rh = h / rows;
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) { const x = k * cw, y = r * rh;
    const gr = g.createLinearGradient(x, y, x + cw * 0.6, y + rh); gr.addColorStop(0, '#2b4a6a'); gr.addColorStop(0.5, '#10233a'); gr.addColorStop(1, '#0a1626'); g.fillStyle = gr; g.fillRect(x, y, cw, rh);
    const lit = rnd(); if (lit > 0.35) { const ig = g.createLinearGradient(x, y, x, y + rh); ig.addColorStop(0, lit > 0.8 ? 'rgba(25,230,193,0.55)' : 'rgba(150,220,255,0.38)'); ig.addColorStop(1, 'rgba(25,230,193,0.08)'); g.fillStyle = ig; g.fillRect(x + 3, y + 3, cw - 6, rh - 6);
      if (rnd() > 0.6) { g.fillStyle = 'rgba(5,10,20,0.75)'; g.fillRect(x + cw * (0.2 + rnd() * 0.5), y + rh * 0.45, cw * 0.08, rh * 0.5); } }
    g.fillStyle = 'rgba(255,170,110,0.18)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + cw * 0.5, y); g.lineTo(x, y + rh * 0.5); g.fill();   // the volcano's glow, reflected
  }
  g.strokeStyle = '#0a0f16'; g.lineWidth = 5; for (let k = 0; k <= cols; k++) { g.beginPath(); g.moveTo(k * cw, 0); g.lineTo(k * cw, h); g.stroke(); }
  g.lineWidth = 9; for (let r = 0; r <= rows; r++) { g.beginPath(); g.moveTo(0, r * rh); g.lineTo(w, r * rh); g.stroke(); }
  const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; };
const glass = (cols, rows, seed) => new T.MeshStandardMaterial({ map: facade(cols, rows, cols * 90, rows * 120, seed), emissiveMap: facade(cols, rows, cols * 90, rows * 120, seed), emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.08, metalness: 0.6 });
const frame = new T.MeshStandardMaterial({ color: 0x1c2330, roughness: 0.5, metalness: 0.7, flatShading: true });
const teal = new T.MeshStandardMaterial({ color: 0x19e6c1, emissive: 0x19e6c1, emissiveIntensity: 1.4 });
const box = (w, h, d, x, y, z, mats) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mats); m.position.set(x, y, z); scene.add(m); return m; };
// two glass storeys and a cantilevered third, slabs between them
const F = (w, d, cols) => [glass(Math.round(d / 2.2), 1, 3), glass(Math.round(d / 2.2), 1, 7), frame, frame, glass(cols, 1, 11), glass(cols, 1, 13)];
box(22, 3.6, 10, 0, 1.8, 0, F(22, 10, 10));
box(22.6, 0.45, 10.6, 0, 3.8, 0, frame);
box(20, 3.6, 9.4, -1, 5.8, 0, F(20, 9.4, 9));
box(26, 0.5, 11.4, 1.5, 7.85, 0.4, frame);
box(26, 3.8, 11, 1.5, 9.9, 0.4, F(26, 11, 12));
box(26.4, 0.6, 11.6, 1.5, 12.1, 0.4, frame);
// columns, a teal line along each slab
[-10.5, -3.5, 3.5, 10.5].forEach(x => box(0.35, 3.6, 0.35, x, 1.8, 5.1, frame));
box(26.2, 0.08, 0.08, 1.5, 7.62, 6.15, teal); box(22.4, 0.08, 0.08, 0, 3.58, 5.32, teal); box(26.6, 0.08, 0.08, 1.5, 11.82, 6.2, teal);
// the entrance canopy
box(7, 0.25, 2.5, 0, 3.3, 6.2, frame); box(6.6, 0.06, 0.06, 0, 3.2, 7.45, teal);
// rooftop: plant, antenna, the sign
box(5, 1.4, 4, -7, 13.1, -1, frame); box(3, 1, 3, 8, 12.9, -2, frame);
const ant = box(0.12, 5, 0.12, -8.5, 15, -1.5, frame); box(0.3, 0.3, 0.3, -8.5, 17.6, -1.5, new T.MeshBasicMaterial({ color: 0xff3a2a }));
// the logo sign: a texture (hex emblem and CONDUIT) on a plane above the third floor's face
const sc = document.createElement('canvas'); sc.width = 2400; sc.height = 520; const sg = sc.getContext('2d');
const hexP = (x, y, r) => { sg.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k - Math.PI / 2; sg.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); } sg.closePath(); };
sg.shadowColor = '#19e6c1'; sg.shadowBlur = 40; sg.strokeStyle = '#19e6c1'; sg.lineWidth = 22; hexP(260, 260, 200); sg.stroke();
sg.fillStyle = '#19e6c1'; sg.beginPath(); sg.moveTo(260, 120); sg.lineTo(345, 260); sg.lineTo(260, 400); sg.lineTo(175, 260); sg.closePath(); sg.fill();
sg.fillStyle = '#e9fffb'; sg.beginPath(); sg.moveTo(260, 165); sg.lineTo(305, 260); sg.lineTo(260, 355); sg.lineTo(215, 260); sg.closePath(); sg.fill();
sg.font = 'italic 900 330px "Inter", "DejaVu Sans", sans-serif'; sg.textBaseline = 'middle'; sg.fillStyle = '#e9fffb'; sg.fillText('CONDUIT', 520, 275);
const st = new T.CanvasTexture(sc); st.encoding = T.sRGBEncoding;
const sign = new T.Mesh(new T.PlaneGeometry(14, 3.03), new T.MeshBasicMaterial({ map: st, transparent: true })); sign.position.set(1.5, 13.95, 6.25); scene.add(sign);
box(14.5, 0.15, 0.6, 1.5, 12.5, 6.0, frame);
scene.rotation.y = 0.32;
