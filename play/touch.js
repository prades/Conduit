// ═══════════════════════════════════════════════════════════════
//  Touch controls for the N64 player
//
//  Rather than synthesising key events — which can only ever be digital,
//  and would make steering full-lock-or-nothing — this presents itself as
//  a real gamepad by wrapping navigator.getGamepads(). The emulator polls
//  it like any other pad and reads genuine analog axes off the stick.
//
//  Standard-mapping indices, and how mupen64plus reads them:
//    axes 0/1  left stick      → N64 analog stick
//    axes 2/3  right stick     → N64 C-buttons
//    btn 1     right face      → N64 A
//    btn 0     bottom face     → N64 B
//    btn 4/5   L1/R1           → N64 L / R
//    btn 6     L2              → N64 Z
//    btn 9     Start           → N64 Start
//
//  Index 0 is the BOTTOM face button, which libretro reads as RetroPad B
//  and mupen64plus maps to N64 B — so N64 A is index 1, not 0. The panel
//  in the settings menu can re-point any of these if a core disagrees.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const LS_LAYOUT = 'n64touch.layout.v1';
  const LS_OPTS   = 'n64touch.opts.v1';
  const LS_MAP    = 'n64touch.map.v1';

  // ── virtual gamepad ──────────────────────────────────────────
  const pad = {
    id: 'N64 Touch Overlay (STANDARD GAMEPAD Vendor: 0000 Product: 0001)',
    index: 0,
    connected: true,
    mapping: 'standard',
    timestamp: performance.now(),
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
  };

  function setButton(i, on) {
    const b = pad.buttons[i];
    if (b.pressed === on) return;
    b.pressed = b.touched = on;
    b.value = on ? 1 : 0;
    pad.timestamp = performance.now();
  }
  function setAxis(i, v) {
    v = Math.max(-1, Math.min(1, v));
    if (pad.axes[i] === v) return;
    pad.axes[i] = v;
    pad.timestamp = performance.now();
  }

  // Slot ours into the first free position so a real controller, if one is
  // plugged in later, still gets through untouched.
  const nativeGetGamepads = navigator.getGamepads
    ? navigator.getGamepads.bind(navigator)
    : () => [];

  navigator.getGamepads = function () {
    const list = Array.prototype.slice.call(nativeGetGamepads());
    if (!enabled) return list;
    let slot = list.findIndex(g => !g);
    if (slot === -1) slot = list.length;
    pad.index = slot;
    list[slot] = pad;
    return list;
  };

  function announce() {
    try {
      const ev = new Event('gamepadconnected');
      ev.gamepad = pad;
      window.dispatchEvent(ev);
    } catch (e) { /* some browsers refuse a synthetic GamepadEvent; polling still finds it */ }
  }

  // ── options + layout ─────────────────────────────────────────
  const DEFAULT_OPTS = { opacity: 0.42, tilt: false, haptics: true, tiltGain: 2.4 };
  let opts = Object.assign({}, DEFAULT_OPTS);
  try { Object.assign(opts, JSON.parse(localStorage.getItem(LS_OPTS) || '{}')); } catch (e) {}

  // Positions are percentages of the viewport, so a layout saved in one
  // orientation still lands somewhere sane in the other.
  const DEFAULT_LAYOUT = {
    stick: { x: 13, y: 68 },
    cpad:  { x: 87, y: 34 },
    a:     { x: 90, y: 76 },
    b:     { x: 78, y: 66 },
    z:     { x: 8,  y: 22 },
    l:     { x: 20, y: 12 },
    r:     { x: 80, y: 12 },
    start: { x: 50, y: 12 },
  };
  let layout = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
  try {
    const saved = JSON.parse(localStorage.getItem(LS_LAYOUT) || 'null');
    if (saved) Object.keys(DEFAULT_LAYOUT).forEach(k => { if (saved[k]) layout[k] = saved[k]; });
  } catch (e) {}

  const saveLayout = () => localStorage.setItem(LS_LAYOUT, JSON.stringify(layout));
  const saveOpts   = () => localStorage.setItem(LS_OPTS, JSON.stringify(opts));

  let enabled = false, editing = false;

  // ── styles ───────────────────────────────────────────────────
  const css = document.createElement('style');
  css.textContent = `
  #tpad{position:fixed;inset:0;z-index:70;pointer-events:none;touch-action:none;
    -webkit-user-select:none;user-select:none;font-family:'SF Mono',Menlo,Consolas,monospace;}
  #tpad.on{display:block;} #tpad.off{display:none;}
  #tpad .ctl{position:absolute;pointer-events:auto;touch-action:none;
    display:flex;align-items:center;justify-content:center;
    transform:translate(-50%,-50%);transition:opacity .25s,background .06s,border-color .06s;
    border-radius:50%;border:2px solid rgba(255,255,255,.55);
    background:rgba(20,26,34,.45);color:#fff;font-weight:bold;letter-spacing:1px;
    backdrop-filter:blur(2px);}
  #tpad .ctl.press{background:rgba(65,217,122,.75);border-color:#41d97a;}
  #tpad .ctl.pill{border-radius:12px;}
  #tpad .btn-a{width:86px;height:86px;font-size:24px;}
  #tpad .btn-b{width:66px;height:66px;font-size:19px;}
  #tpad .btn-z{width:74px;height:52px;font-size:15px;border-radius:12px;}
  #tpad .btn-sh{width:88px;height:46px;font-size:14px;border-radius:12px;}
  #tpad .btn-st{width:72px;height:38px;font-size:12px;border-radius:19px;}

  /* stick: the ring is a home marker, the knob is what actually moves */
  #tpad .stickbase{width:132px;height:132px;border-style:dashed;background:rgba(20,26,34,.28);}
  #tpad .knob{position:absolute;width:62px;height:62px;border-radius:50%;
    border:2px solid rgba(255,255,255,.8);background:rgba(65,217,122,.4);
    transform:translate(-50%,-50%);pointer-events:none;transition:opacity .2s;}
  #tpad .cbase{width:104px;height:104px;font-size:11px;}
  #tpad .cknob{position:absolute;width:46px;height:46px;border-radius:50%;
    border:2px solid rgba(255,255,255,.75);background:rgba(58,194,224,.42);
    transform:translate(-50%,-50%);pointer-events:none;}

  #tpad.edit .ctl{border-color:#e0a13a;border-style:solid;box-shadow:0 0 0 3px rgba(224,161,58,.3);}
  #tpad .lbl{position:absolute;top:-16px;left:50%;transform:translateX(-50%);
    font-size:9px;color:#e0a13a;letter-spacing:1px;display:none;}
  #tpad.edit .lbl{display:block;}

  #tgear{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:75;
    pointer-events:auto;touch-action:manipulation;background:rgba(10,13,18,.8);border:1px solid #26313f;color:#9fb0c4;
    padding:8px 14px;border-radius:6px;font:11px 'SF Mono',Menlo,monospace;letter-spacing:1px;
    cursor:pointer;}
  #tgear:active{border-color:#41d97a;color:#41d97a;}

  #tmenu{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;
    background:rgba(6,9,13,.9);pointer-events:auto;touch-action:manipulation;
    font:12px 'SF Mono',Menlo,Consolas,monospace;color:#9fb0c4;}
  #tmenu.on{display:flex;}
  #tmenu .card{background:#121821;border:1px solid #26313f;border-radius:10px;
    padding:20px;width:min(440px,92vw);max-height:88vh;overflow:auto;}
  #tmenu h3{color:#41d97a;font-size:13px;letter-spacing:3px;margin-bottom:4px;font-weight:normal;}
  #tmenu .sub{color:#5a6b7f;font-size:11px;line-height:1.8;margin-bottom:16px;}
  #tmenu .row{display:flex;align-items:center;gap:12px;margin-bottom:12px;min-height:42px;}
  #tmenu .row span.k{width:96px;color:#5a6b7f;font-size:11px;letter-spacing:1px;flex-shrink:0;}
  #tmenu input[type=range]{flex:1;height:36px;-webkit-appearance:none;background:transparent;}
  #tmenu input[type=range]::-webkit-slider-runnable-track{height:5px;background:#26313f;border-radius:3px;}
  #tmenu input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;
    border-radius:50%;background:#41d97a;margin-top:-9px;}
  #tmenu button{touch-action:manipulation;background:#1a212c;border:1px solid #26313f;color:#9fb0c4;padding:10px 14px;
    border-radius:6px;font:inherit;letter-spacing:1px;cursor:pointer;min-height:42px;}
  #tmenu button.on{border-color:#41d97a;color:#41d97a;}
  #tmenu button.wide{flex:1;}
  #tmenu .note{font-size:10px;color:#5a6b7f;line-height:1.8;margin-top:10px;}
  `;
  document.head.appendChild(css);

  // ── build the overlay ────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'tpad'; root.className = 'off';
  document.body.appendChild(root);

  function mk(key, cls, text, label) {
    const el = document.createElement('div');
    el.className = 'ctl ' + cls;
    el.dataset.key = key;
    if (text) el.textContent = text;
    const l = document.createElement('div');
    l.className = 'lbl'; l.textContent = label || key.toUpperCase();
    el.appendChild(l);
    root.appendChild(el);
    return el;
  }

  const els = {
    stick: mk('stick', 'stickbase', '', 'STICK'),
    cpad:  mk('cpad',  'cbase', 'C', 'C-PAD'),
    a:     mk('a',     'btn-a', 'A'),
    b:     mk('b',     'btn-b', 'B'),
    z:     mk('z',     'btn-z', 'Z'),
    l:     mk('l',     'btn-sh', 'L'),
    r:     mk('r',     'btn-sh', 'R'),
    start: mk('start', 'btn-st', 'START'),
  };

  const knob = document.createElement('div');
  knob.className = 'knob'; root.appendChild(knob);
  const cknob = document.createElement('div');
  cknob.className = 'cknob'; root.appendChild(cknob);

  const gear = document.createElement('button');
  gear.id = 'tgear'; gear.textContent = '⚙ CONTROLS';
  gear.style.display = 'none';
  document.body.appendChild(gear);

  function place() {
    Object.keys(els).forEach(k => {
      els[k].style.left = layout[k].x + '%';
      els[k].style.top  = layout[k].y + '%';
    });
    resetKnob(); resetCKnob();
    root.style.opacity = opts.opacity;
  }
  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: Math.min(r.width, r.height) / 2 };
  }
  function resetKnob() {
    const c = centerOf(els.stick);
    knob.style.left = c.x + 'px'; knob.style.top = c.y + 'px';
  }
  function resetCKnob() {
    const c = centerOf(els.cpad);
    cknob.style.left = c.x + 'px'; cknob.style.top = c.y + 'px';
  }

  // ── haptics ──────────────────────────────────────────────────
  const buzz = ms => { if (opts.haptics && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} } };

  // ── button bindings ──────────────────────────────────────────
  const DEFAULT_BTN = { a: 1, b: 0, l: 4, r: 5, z: 6, start: 9 };
  let BTN = Object.assign({}, DEFAULT_BTN);
  try { Object.assign(BTN, JSON.parse(localStorage.getItem(LS_MAP) || '{}')); } catch (e) {}
  const saveMap = () => localStorage.setItem(LS_MAP, JSON.stringify(BTN));

  Object.keys(BTN).forEach(k => {
    const el = els[k];
    let holding = null;
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (editing) return startDrag(k, e);
      holding = e.pointerId;
      el.setPointerCapture(e.pointerId);
      el.classList.add('press');
      setButton(BTN[k], true);
      buzz(8);
    });
    const release = e => {
      if (editing || holding !== e.pointerId) return;
      holding = null;
      el.classList.remove('press');
      setButton(BTN[k], false);
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  });

  // ── analog stick ─────────────────────────────────────────────
  // The visible ring is only a home marker. Touching anywhere in the left
  // half re-homes the stick under the thumb, so you never hunt for it.
  let stickId = null, stickOrigin = null, stickRadius = 60;

  function beginStick(clientX, clientY, id) {
    stickId = id;
    stickOrigin = { x: clientX, y: clientY };
    stickRadius = Math.max(48, centerOf(els.stick).r);
    els.stick.style.left = clientX + 'px';
    els.stick.style.top  = clientY + 'px';
    els.stick.style.opacity = '1';
    moveStick(clientX, clientY);
  }

  function moveStick(clientX, clientY) {
    let dx = clientX - stickOrigin.x, dy = clientY - stickOrigin.y;
    const d = Math.hypot(dx, dy);
    if (d > stickRadius) { dx = dx / d * stickRadius; dy = dy / d * stickRadius; }
    knob.style.left = (stickOrigin.x + dx) + 'px';
    knob.style.top  = (stickOrigin.y + dy) + 'px';

    let nx = dx / stickRadius, ny = dy / stickRadius;
    // small deadzone, then rescale so the usable range still reaches 1.0
    const mag = Math.hypot(nx, ny), DZ = 0.12;
    if (mag < DZ) { nx = ny = 0; }
    else {
      const s = ((mag - DZ) / (1 - DZ)) / mag;
      nx *= s; ny *= s;
      // ease the centre for fine steering without losing full lock
      const g = Math.pow(Math.min(1, Math.hypot(nx, ny)), 1.25) / Math.max(1e-6, Math.hypot(nx, ny));
      nx *= g; ny *= g;
    }
    if (!opts.tilt) setAxis(0, nx);
    setAxis(1, ny);
  }

  function endStick() {
    stickId = null;
    if (!opts.tilt) setAxis(0, 0);
    setAxis(1, 0);
    els.stick.style.left = layout.stick.x + '%';
    els.stick.style.top  = layout.stick.y + '%';
    requestAnimationFrame(resetKnob);
  }

  // ── C-pad (right stick) ──────────────────────────────────────
  let cId = null, cOrigin = null, cRadius = 46;

  function beginC(x, y, id) {
    cId = id;
    const c = centerOf(els.cpad);
    cOrigin = { x: c.x, y: c.y };
    cRadius = Math.max(38, c.r);
    moveC(x, y);
  }
  function moveC(x, y) {
    let dx = x - cOrigin.x, dy = y - cOrigin.y;
    const d = Math.hypot(dx, dy);
    if (d > cRadius) { dx = dx / d * cRadius; dy = dy / d * cRadius; }
    cknob.style.left = (cOrigin.x + dx) + 'px';
    cknob.style.top  = (cOrigin.y + dy) + 'px';
    // C-buttons are discrete, so snap hard rather than feeding a soft axis
    const nx = dx / cRadius, ny = dy / cRadius;
    setAxis(2, Math.abs(nx) > 0.45 ? Math.sign(nx) : 0);
    setAxis(3, Math.abs(ny) > 0.45 ? Math.sign(ny) : 0);
  }
  function endC() {
    cId = null; setAxis(2, 0); setAxis(3, 0); resetCKnob();
  }

  els.cpad.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (editing) return startDrag('cpad', e);
    els.cpad.setPointerCapture(e.pointerId);
    beginC(e.clientX, e.clientY, e.pointerId);
    buzz(6);
  });
  els.cpad.addEventListener('pointermove', e => { if (cId === e.pointerId) moveC(e.clientX, e.clientY); });
  els.cpad.addEventListener('pointerup', e => { if (cId === e.pointerId) endC(); });
  els.cpad.addEventListener('pointercancel', e => { if (cId === e.pointerId) endC(); });

  // The stick ring itself is draggable in edit mode; in play it just marks home.
  els.stick.addEventListener('pointerdown', e => { if (editing) { e.preventDefault(); startDrag('stick', e); } });

  // Left-half catcher for the floating stick. Sits behind the buttons so a
  // thumb landing on A never steals steering.
  const catcher = document.createElement('div');
  catcher.style.cssText = 'position:absolute;left:0;top:0;width:48%;height:100%;pointer-events:auto;touch-action:none;';
  root.insertBefore(catcher, root.firstChild);

  catcher.addEventListener('pointerdown', e => {
    if (editing || stickId !== null) return;
    e.preventDefault();
    catcher.setPointerCapture(e.pointerId);
    beginStick(e.clientX, e.clientY, e.pointerId);
    buzz(6);
  });
  catcher.addEventListener('pointermove', e => { if (stickId === e.pointerId) moveStick(e.clientX, e.clientY); });
  catcher.addEventListener('pointerup', e => { if (stickId === e.pointerId) endStick(); });
  catcher.addEventListener('pointercancel', e => { if (stickId === e.pointerId) endStick(); });

  // ── drag to reposition ───────────────────────────────────────
  let drag = null;
  function startDrag(key, e) {
    drag = { key, id: e.pointerId };
    els[key].setPointerCapture(e.pointerId);
  }
  root.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    layout[drag.key] = {
      x: Math.max(4, Math.min(96, (e.clientX / window.innerWidth) * 100)),
      y: Math.max(6, Math.min(94, (e.clientY / window.innerHeight) * 100)),
    };
    els[drag.key].style.left = layout[drag.key].x + '%';
    els[drag.key].style.top  = layout[drag.key].y + '%';
    if (drag.key === 'stick') resetKnob();
    if (drag.key === 'cpad')  resetCKnob();
  });
  ['pointerup', 'pointercancel'].forEach(ev =>
    root.addEventListener(ev, e => { if (drag && drag.id === e.pointerId) { drag = null; saveLayout(); } }));

  // ── tilt steering ────────────────────────────────────────────
  let tiltNeutral = null;
  function onTilt(e) {
    if (!opts.tilt) return;
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    // in landscape the wheel-like axis is beta; in portrait it is gamma
    const landscape = Math.abs(angle) === 90 || Math.abs(angle) === 270;
    let raw = landscape ? e.beta : e.gamma;
    if (raw == null) return;
    if (angle === 270 || angle === -90) raw = -raw;
    if (tiltNeutral === null) tiltNeutral = raw;
    const delta = (raw - tiltNeutral) / 30;          // ~30° for full lock
    setAxis(0, Math.max(-1, Math.min(1, delta * opts.tiltGain / 2.4)));
  }
  window.addEventListener('deviceorientation', onTilt);

  async function enableTilt(on) {
    if (on && typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== 'granted') { on = false; alert('Motion access was denied, so tilt steering stays off.'); }
      } catch (e) { on = false; }
    }
    opts.tilt = on; tiltNeutral = null;
    if (!on) setAxis(0, 0);
    saveOpts();
    return on;
  }

  // ── settings menu ────────────────────────────────────────────
  const menu = document.createElement('div');
  menu.id = 'tmenu';
  menu.innerHTML = `
    <div class="card">
      <h3>TOUCH CONTROLS</h3>
      <div class="sub">
        Steering is analog — drag anywhere on the left half and the stick homes
        to your thumb. Tap MOVE to drag any control somewhere that suits your hands;
        the layout is remembered.
      </div>
      <div class="row"><span class="k">OPACITY</span>
        <input type="range" id="t-op" min="0.15" max="1" step="0.01"></div>
      <div class="row"><span class="k">TILT GAIN</span>
        <input type="range" id="t-tg" min="1" max="5" step="0.1"></div>
      <div class="row">
        <button id="t-tilt" class="wide">TILT STEERING</button>
        <button id="t-hap" class="wide">HAPTICS</button>
      </div>
      <div class="row">
        <button id="t-move" class="wide">MOVE CONTROLS</button>
        <button id="t-reset" class="wide">RESET LAYOUT</button>
      </div>
      <div class="row">
        <button id="t-hide" class="wide">HIDE OVERLAY</button>
        <button id="t-close" class="wide">CLOSE</button>
      </div>
      <h3 style="margin-top:18px">BUTTON MAP</h3>
      <div class="sub">
        If a button does the wrong thing, step its gamepad index until it lands.
        Cores differ on which physical button becomes which N64 button.
      </div>
      <div id="t-map"></div>
      <div class="row"><button id="t-mapreset" class="wide">RESET BUTTON MAP</button></div>
      <div class="note">
        The overlay presents itself to the emulator as a standard gamepad, so it
        feeds real analog values rather than on/off key presses. A paired Bluetooth
        controller still takes priority and will feel better than glass for anything
        that needs precise steering.
      </div>
    </div>`;
  document.body.appendChild(menu);

  const $ = id => menu.querySelector(id);

  function renderMap() {
    const wrap = $('#t-map');
    wrap.innerHTML = '';
    Object.keys(DEFAULT_BTN).forEach(k => {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = '<span class="k">' + k.toUpperCase() + '</span>' +
        '<button data-d="-1">−</button>' +
        '<b style="min-width:34px;text-align:center;color:#41d97a">' + BTN[k] + '</b>' +
        '<button data-d="1">+</button>';
      row.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        setButton(BTN[k], false);          // let go of the old index first
        BTN[k] = (BTN[k] + (+b.dataset.d) + 17) % 17;
        saveMap(); renderMap();
      }));
      wrap.appendChild(row);
    });
  }

  $('#t-mapreset').addEventListener('click', () => {
    Object.values(BTN).forEach(i => setButton(i, false));
    BTN = Object.assign({}, DEFAULT_BTN);
    saveMap(); renderMap();
  });
  const syncMenu = () => {
    renderMap();
    $('#t-op').value = opts.opacity;
    $('#t-tg').value = opts.tiltGain;
    $('#t-tilt').classList.toggle('on', !!opts.tilt);
    $('#t-hap').classList.toggle('on', !!opts.haptics);
    $('#t-move').classList.toggle('on', editing);
    $('#t-move').textContent = editing ? 'DONE MOVING' : 'MOVE CONTROLS';
  };

  gear.addEventListener('click', () => {
    if (gear.dataset.hidden) {          // re-show the overlay rather than opening settings
      root.classList.add('on'); root.classList.remove('off');
      gear.textContent = '⚙ CONTROLS';
      delete gear.dataset.hidden;
      return;
    }
    syncMenu(); menu.classList.add('on');
  });
  $('#t-close').addEventListener('click', () => menu.classList.remove('on'));
  $('#t-op').addEventListener('input', e => { opts.opacity = +e.target.value; root.style.opacity = opts.opacity; saveOpts(); });
  $('#t-tg').addEventListener('input', e => { opts.tiltGain = +e.target.value; saveOpts(); });
  $('#t-hap').addEventListener('click', () => { opts.haptics = !opts.haptics; saveOpts(); syncMenu(); buzz(12); });
  $('#t-tilt').addEventListener('click', async () => { await enableTilt(!opts.tilt); syncMenu(); });
  $('#t-move').addEventListener('click', () => {
    editing = !editing;
    root.classList.toggle('edit', editing);
    root.style.opacity = editing ? 1 : opts.opacity;
    syncMenu();
    if (!editing) menu.classList.remove('on');
  });
  $('#t-reset').addEventListener('click', () => {
    layout = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
    saveLayout(); place();
  });
  $('#t-hide').addEventListener('click', () => {
    root.classList.remove('on'); root.classList.add('off');
    menu.classList.remove('on');
    gear.textContent = '⚙ SHOW CONTROLS';
    gear.dataset.hidden = '1';
  });
  window.addEventListener('resize', () => { place(); });
  window.addEventListener('orientationchange', () => setTimeout(place, 250));

  // ── public API ───────────────────────────────────────────────
  window.TouchPad = {
    show() {
      enabled = true;
      root.classList.add('on'); root.classList.remove('off');
      gear.style.display = 'block';
      place();
      announce();
    },
    hide() {
      enabled = false;
      root.classList.remove('on'); root.classList.add('off');
      gear.style.display = 'none';
    },
  };
})();
