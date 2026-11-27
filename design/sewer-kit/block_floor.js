  // ══ THE SEWER KIT, ON THE FLOOR (design/sewer-kit/kit.js, the draft's; see its walls' part above): round iron access covers on the rooms' concrete (not the walkways' grating), now and then,
  // away from the walls, the water and the grates. Then each group's pieces
  // laid into its one painted mesh and its one stain mesh.
  const kitCoverTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), R = 60;
    g.clearRect(0, 0, 128, 128); g.fillStyle = '#34312e'; g.beginPath(); g.arc(64, 64, R, 0, 6.2832); g.fill();
    g.strokeStyle = '#2c2a27'; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, R - 3, 0, 6.2832); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(64, 64, R - 12, 0, 6.2832); g.stroke();
    g.save(); g.beginPath(); g.arc(64, 64, R - 14, 0, 6.2832); g.clip(); g.strokeStyle = '#4a4642'; g.lineWidth = 3; for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(0, 64 + i * 10); g.lineTo(128, 64 + i * 10 + 30); g.stroke(); g.beginPath(); g.moveTo(0, 64 + i * 10 + 30); g.lineTo(128, 64 + i * 10); g.stroke(); } g.restore();
    g.fillStyle = '#1e1c1a'; for (const [x, y] of [[40, 64], [88, 64]]) { g.beginPath(); g.ellipse(x, y, 7, 3.5, 0, 0, 6.2832); g.fill(); }
    for (let i = 0; i < 260; i++) { const a = hsh(i, 1, 431) * 6.2832, r = Math.sqrt(hsh(i, 2, 432)) * R; g.fillStyle = 'rgba(' + (hsh(i, 3, 433) < 0.5 ? '110,58,30' : '20,18,16') + ',' + (0.15 + 0.25 * hsh(i, 4, 434)).toFixed(2) + ')'; g.fillRect(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 2 + hsh(i, 5, 435) * 3, 2); }
    const tx = new T.CanvasTexture(c); tx.anisotropy = 2; return tx; })();
  M.kitCover = new T.MeshStandardMaterial({ map: kitCoverTex, alphaTest: 0.5, vertexColors: true, roughness: 0.75, metalness: 0.15, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  { const covers = []; for (const k of cellAt.keys()) { const [cx, cy] = k.split(',').map(Number); if (!dry(k) || hsh(cx, cy, 436) > 0.03 || nearW(cx, cy, 3) || DIRS.some(([dx, dy]) => !cellAt.has(K(cx + dx, cy + dy)))) continue;
      if (covers.some(q => Math.abs(q[0] - cx) + Math.abs(q[1] - cy) < 7) || grates.some(q => Math.abs(q[0] - cx) + Math.abs(q[1] - cy) < 3)) continue; covers.push([cx, cy]);
      const y = floorY.get(k) + 0.005, R = 0.42, g = new T.CircleGeometry(R * 60 / 64, 20); g.rotateX(-Math.PI / 2); g.translate(cx, y, cy);   // (a round disc, not a square: the look's ink line goes round its own edge)
      const gg = g.index ? g.toNonIndexed() : g; gg.setAttribute('color', new T.Float32BufferAttribute(new Array(gg.attributes.position.count * 3).fill(1), 3));
      const m = new T.Mesh(gg, M.kitCover); m.userData.swAdded = true; addTo(cellAt.get(k)).add(m); kitN.covers++; } }
  // (no cabinet stands on the floor: a box standing by a wall hid a body behind it in a quarter turn the guard checks, where the wall sinks but a thing on the floor does not. The big cabinets
  //  hang on the walls instead, with the walls' own: block_walls.js)
  // each group's pieces into its one painted mesh and its one stain mesh
  for (const [par, A] of accs) { if (!A.pos.length) continue; const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(A.pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(A.nor, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(A.col, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(new Array(A.pos.length / 3 * 2).fill(0), 2)); const m = new T.Mesh(g, M.kit); m.userData.swAdded = true; par.add(m); }
  for (const [par, S2] of stains) { if (!S2.pos.length) continue; const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(S2.pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(S2.uv, 2));
    g.setAttribute('color', new T.Float32BufferAttribute(S2.col, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(new Array(S2.pos.length).fill(0).map((v, i) => i % 3 === 1 ? 1 : 0), 3));
    const m = new T.Mesh(g, M.kitStain); m.userData.swAdded = true; m.userData.noInk = true; m.renderOrder = 1; par.add(m); }
  kitN.WALL_H = +WALL_H.toFixed(3); if (typeof window !== 'undefined') window.__sewerKit = kitN;   // (the draft's counts, for its pictures' report)
