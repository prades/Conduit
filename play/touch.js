// ═══════════════════════════════════════════════════════════════
//  Touch controls for the N64 player
//
//  Input goes out over two paths at once, because which one a core
//  actually listens to is not something you can know in advance:
//
//   • Gamepad  — wraps navigator.getGamepads() and presents a standard
//                pad. This is the only way to send true analog values,
//                so steering is not full-lock-or-nothing.
//   • Keyboard — synthesises key events. Digital only, but emulators
//                ship default keyboard bindings, so it usually works
//                even when nothing is bound for a gamepad.
//
//  Both are on by default. The settings menu shows a live count of how
//  often the page has polled for gamepads: if that stays at zero, the
//  emulator is not reading the pad at all and keyboard is the live path.
//  Every binding — gamepad index and key — is editable in there, since
//  cores disagree about which physical button becomes which N64 button.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const LS_LAYOUT = 'n64touch.layout.v1';
  const LS_OPTS   = 'n64touch.opts.v2';
  const LS_MAP    = 'n64touch.map.v2';

  const CONTROLS = ['a', 'b', 'z', 'l', 'r', 'start'];

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

  let pollCount = 0;

  function padButton(i, on) {
    const b = pad.buttons[i];
    if (!b || b.pressed === on) return;
    b.pressed = b.touched = on;
    b.value = on ? 1 : 0;
    pad.timestamp = performance.now();
  }
  function padAxis(i, v) {
    v = Math.max(-1, Math.min(1, v));
    if (pad.axes[i] === v) return;
    pad.axes[i] = v;
    pad.timestamp = performance.now();
  }

  const nativeGetGamepads = navigator.getGamepads
    ? navigator.getGamepads.bind(navigator)
    : () => [];

  navigator.getGamepads = function () {
    pollCount++;
    const list = Array.prototype.slice.call(nativeGetGamepads());
    if (!enabled || mode === 'keyboard') return list;
    let slot = list.findIndex(g => !g);   // leave room for a real controller
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
    } catch (e) { /* polling still finds it */ }
  }

  // ── synthetic keyboard ───────────────────────────────────────
  const ARROW_CODES = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39 };

  function keyInfo(k) {
    if (k === 'Enter') return { key: 'Enter', code: 'Enter', keyCode: 13 };
    if (k === 'Shift') return { key: 'Shift', code: 'ShiftLeft', keyCode: 16 };
    if (k === 'Space') return { key: ' ', code: 'Space', keyCode: 32 };
    if (ARROW_CODES[k]) return { key: k, code: k, keyCode: ARROW_CODES[k] };
    return { key: k, code: 'Key' + k.toUpperCase(), keyCode: k.toUpperCase().charCodeAt(0) };
  }

  // Many emulator front ends still read the legacy keyCode/which fields,
  // and the KeyboardEvent constructor will not set them — so they are
  // defined onto each event by hand.
  function fireKey(type, k, target) {
    const i = keyInfo(k);
    const ev = new KeyboardEvent(type, {
      key: i.key, code: i.code, bubbles: true, cancelable: true, composed: true,
    });
    try {
      Object.defineProperty(ev, 'keyCode', { get: () => i.keyCode });
      Object.defineProperty(ev, 'which',   { get: () => i.keyCode });
    } catch (e) {}
    target.dispatchEvent(ev);
  }

  function sendKey(k, down) {
    if (!k) return;
    const type = down ? 'keydown' : 'keyup';
    fireKey(type, k, document);           // bubbles on to window
    const cv = document.querySelector('#game canvas');
    if (cv) fireKey(type, k, cv);
  }

  // ── options, bindings, layout ────────────────────────────────
  const DEFAULT_OPTS = { opacity: 0.42, tilt: false, haptics: true, tiltGain: 2.4,
                         mode: 'both', overlay: false };
  let opts = Object.assign({}, DEFAULT_OPTS);
  try { Object.assign(opts, JSON.parse(localStorage.getItem(LS_OPTS) || '{}')); } catch (e) {}
  let mode = opts.mode;

  // Gamepad index 0 is the BOTTOM face button, which libretro reads as
  // RetroPad B and mupen64plus turns into N64 B — so N64 A is index 1.
  // Keyboard defaults follow the usual RetroArch layout.
  const DEFAULT_MAP = {
    a:     { pad: 1, key: 'x' },
    b:     { pad: 0, key: 'z' },
    z:     { pad: 6, key: 't' },
    l:     { pad: 4, key: 'q' },
    r:     { pad: 5, key: 'e' },
    start: { pad: 9, key: 'Enter' },
  };
  let MAP = JSON.parse(JSON.stringify(DEFAULT_MAP));
  try {
    const saved = JSON.parse(localStorage.getItem(LS_MAP) || 'null');
    if (saved) CONTROLS.forEach(k => { if (saved[k]) MAP[k] = Object.assign({}, DEFAULT_MAP[k], saved[k]); });
  } catch (e) {}

  const KEY_CHOICES = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('')
    .concat(['Enter','Shift','Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);

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
  const saveOpts   = () => { opts.mode = mode; localStorage.setItem(LS_OPTS, JSON.stringify(opts)); };
  const saveMap    = () => localStorage.setItem(LS_MAP, JSON.stringify(MAP));

  let enabled = false, editing = false;

  // ── unified press/release ────────────────────────────────────
  function press(name, on) {
    const m = MAP[name];
    if (!m) return;
    if (mode !== 'keyboard') padButton(m.pad, on);
    if (mode !== 'gamepad')  sendKey(m.key, on);
  }
  function releaseAll() {
    CONTROLS.forEach(n => press(n, false));
    Object.keys(stickKeys).forEach(d => {
      if (stickKeys[d]) { stickKeys[d] = false; sendKey(ARROW_OF[d], false); }
    });
  }

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
  #tpad .btn-a{width:86px;height:86px;font-size:24px;}
  #tpad .btn-b{width:66px;height:66px;font-size:19px;}
  #tpad .btn-z{width:74px;height:52px;font-size:15px;border-radius:12px;}
  #tpad .btn-sh{width:88px;height:46px;font-size:14px;border-radius:12px;}
  #tpad .btn-st{width:72px;height:38px;font-size:12px;border-radius:19px;}
  #tpad .stickbase{width:132px;height:132px;border-style:dashed;background:rgba(20,26,34,.28);}
  #tpad .knob{position:absolute;width:62px;height:62px;border-radius:50%;
    border:2px solid rgba(255,255,255,.8);background:rgba(65,217,122,.4);
    transform:translate(-50%,-50%);pointer-events:none;}
  #tpad .cbase{width:104px;height:104px;font-size:11px;}
  #tpad .cknob{position:absolute;width:46px;height:46px;border-radius:50%;
    border:2px solid rgba(255,255,255,.75);background:rgba(58,194,224,.42);
    transform:translate(-50%,-50%);pointer-events:none;}
  #tpad.edit .ctl{border-color:#e0a13a;border-style:solid;box-shadow:0 0 0 3px rgba(224,161,58,.3);}
  #tpad .lbl{position:absolute;top:-16px;left:50%;transform:translateX(-50%);
    font-size:9px;color:#e0a13a;letter-spacing:1px;display:none;}
  #tpad.edit .lbl{display:block;}

  #tgear{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:75;
    pointer-events:auto;touch-action:manipulation;background:rgba(10,13,18,.8);
    border:1px solid #26313f;color:#9fb0c4;padding:8px 14px;border-radius:6px;
    font:11px 'SF Mono',Menlo,monospace;letter-spacing:1px;cursor:pointer;}
  #tgear:active{border-color:#41d97a;color:#41d97a;}

  #tmenu{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;
    background:rgba(6,9,13,.9);pointer-events:auto;touch-action:manipulation;
    font:12px 'SF Mono',Menlo,Consolas,monospace;color:#9fb0c4;}
  #tmenu.on{display:flex;}
  #tmenu .card{background:#121821;border:1px solid #26313f;border-radius:10px;
    padding:0 20px 20px;width:min(480px,93vw);max-height:88vh;overflow:auto;
    -webkit-overflow-scrolling:touch;}
  #tmenu .sticky{position:sticky;top:0;background:#121821;padding:16px 0 10px;
    margin-bottom:4px;border-bottom:1px solid #26313f;display:flex;
    align-items:center;justify-content:space-between;gap:12px;z-index:1;}
  #tmenu h3{color:#41d97a;font-size:13px;letter-spacing:3px;margin:0 0 4px;font-weight:normal;}
  #tmenu .sub{color:#5a6b7f;font-size:11px;line-height:1.8;margin-bottom:14px;}
  #tmenu .row{display:flex;align-items:center;gap:10px;margin-bottom:10px;min-height:42px;}
  #tmenu .row span.k{width:90px;color:#5a6b7f;font-size:11px;letter-spacing:1px;flex-shrink:0;}
  #tmenu input[type=range]{flex:1;height:36px;-webkit-appearance:none;background:transparent;}
  #tmenu input[type=range]::-webkit-slider-runnable-track{height:5px;background:#26313f;border-radius:3px;}
  #tmenu input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;
    border-radius:50%;background:#41d97a;margin-top:-9px;}
  #tmenu button{touch-action:manipulation;background:#1a212c;border:1px solid #26313f;
    color:#9fb0c4;padding:10px 13px;border-radius:6px;font:inherit;letter-spacing:1px;
    cursor:pointer;min-height:42px;}
  #tmenu button.on{border-color:#41d97a;color:#41d97a;}
  #tmenu button.wide{flex:1;}
  #tmenu button.step{min-width:38px;padding:10px 8px;}
  #tmenu .note{font-size:10px;color:#5a6b7f;line-height:1.8;margin-top:8px;}
  #tmenu .diag{font-size:11px;line-height:1.9;background:#0d131b;border:1px solid #26313f;
    border-radius:6px;padding:10px 12px;margin-bottom:14px;}
  #tmenu .diag b{color:#41d97a;font-weight:normal;}
  #tmenu .diag b.bad{color:#e0a13a;}
  .maprow{display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;}
  .maprow .nm{width:52px;color:#dfe8f2;font-size:12px;}
  .maprow .tag{font-size:9px;color:#5a6b7f;letter-spacing:1px;}
  .maprow .val{min-width:44px;text-align:center;color:#41d97a;font-size:12px;}
  `;
  document.head.appendChild(css);

  // ── overlay DOM ──────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'tpad'; root.className = 'off';
  document.body.appendChild(root);

  function mk(key, cls, text, label) {
    const el = document.createElement('div');
    el.className = 'ctl ' + cls;
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
  gear.id = 'tgear'; gear.textContent = '⚙ TOUCH SETUP';
  gear.style.display = 'none';
  document.body.appendChild(gear);

  const centerOf = el => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: Math.min(r.width, r.height) / 2 };
  };
  const resetKnob  = () => { const c = centerOf(els.stick); knob.style.left = c.x + 'px'; knob.style.top = c.y + 'px'; };
  const resetCKnob = () => { const c = centerOf(els.cpad);  cknob.style.left = c.x + 'px'; cknob.style.top = c.y + 'px'; };

  function place() {
    Object.keys(els).forEach(k => {
      els[k].style.left = layout[k].x + '%';
      els[k].style.top  = layout[k].y + '%';
    });
    resetKnob(); resetCKnob();
    root.style.opacity = opts.opacity;
  }

  const buzz = ms => { if (opts.haptics && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} } };

  // ── buttons ──────────────────────────────────────────────────
  CONTROLS.forEach(name => {
    const el = els[name];
    let holding = null;
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (editing) return startDrag(name, e);
      holding = e.pointerId;
      el.setPointerCapture(e.pointerId);
      el.classList.add('press');
      press(name, true);
      buzz(8);
    });
    const release = e => {
      if (editing || holding !== e.pointerId) return;
      holding = null;
      el.classList.remove('press');
      press(name, false);
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  });

  // ── analog stick ─────────────────────────────────────────────
  const ARROW_OF = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  const stickKeys = { up: false, down: false, left: false, right: false };
  let stickId = null, stickOrigin = null, stickRadius = 60;

  function updateStickKeys(nx, ny) {
    if (mode === 'gamepad') return;
    const T = 0.42;
    const want = { left: nx < -T, right: nx > T, up: ny < -T, down: ny > T };
    Object.keys(want).forEach(d => {
      if (want[d] !== stickKeys[d]) { stickKeys[d] = want[d]; sendKey(ARROW_OF[d], want[d]); }
    });
  }

  function beginStick(x, y, id) {
    stickId = id;
    stickOrigin = { x, y };
    stickRadius = Math.max(48, centerOf(els.stick).r);
    els.stick.style.left = x + 'px';
    els.stick.style.top  = y + 'px';
    moveStick(x, y);
  }

  function moveStick(x, y) {
    let dx = x - stickOrigin.x, dy = y - stickOrigin.y;
    const d = Math.hypot(dx, dy);
    if (d > stickRadius) { dx = dx / d * stickRadius; dy = dy / d * stickRadius; }
    knob.style.left = (stickOrigin.x + dx) + 'px';
    knob.style.top  = (stickOrigin.y + dy) + 'px';

    let nx = dx / stickRadius, ny = dy / stickRadius;
    const mag = Math.hypot(nx, ny), DZ = 0.12;
    if (mag < DZ) { nx = ny = 0; }
    else {
      // rescale past the deadzone so full lock is still reachable, then
      // ease the centre slightly for fine steering
      const s = ((mag - DZ) / (1 - DZ)) / mag;
      nx *= s; ny *= s;
      const m2 = Math.hypot(nx, ny);
      if (m2 > 1e-6) { const g = Math.pow(Math.min(1, m2), 1.25) / m2; nx *= g; ny *= g; }
    }
    if (mode !== 'keyboard') { if (!opts.tilt) padAxis(0, nx); padAxis(1, ny); }
    updateStickKeys(nx, ny);
  }

  function endStick() {
    stickId = null;
    if (mode !== 'keyboard') { if (!opts.tilt) padAxis(0, 0); padAxis(1, 0); }
    updateStickKeys(0, 0);
    els.stick.style.left = layout.stick.x + '%';
    els.stick.style.top  = layout.stick.y + '%';
    requestAnimationFrame(resetKnob);
  }

  // ── C-pad ────────────────────────────────────────────────────
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
    const nx = dx / cRadius, ny = dy / cRadius;   // C inputs are discrete, so snap
    padAxis(2, Math.abs(nx) > 0.45 ? Math.sign(nx) : 0);
    padAxis(3, Math.abs(ny) > 0.45 ? Math.sign(ny) : 0);
  }
  function endC() { cId = null; padAxis(2, 0); padAxis(3, 0); resetCKnob(); }

  els.cpad.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (editing) return startDrag('cpad', e);
    els.cpad.setPointerCapture(e.pointerId);
    beginC(e.clientX, e.clientY, e.pointerId);
    buzz(6);
  });
  els.cpad.addEventListener('pointermove', e => { if (cId === e.pointerId) moveC(e.clientX, e.clientY); });
  els.cpad.addEventListener('pointerup',     e => { if (cId === e.pointerId) endC(); });
  els.cpad.addEventListener('pointercancel', e => { if (cId === e.pointerId) endC(); });

  els.stick.addEventListener('pointerdown', e => { if (editing) { e.preventDefault(); startDrag('stick', e); } });

  // Catcher for the floating stick, behind the buttons so a thumb landing
  // on A never steals steering.
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
  catcher.addEventListener('pointermove',   e => { if (stickId === e.pointerId) moveStick(e.clientX, e.clientY); });
  catcher.addEventListener('pointerup',     e => { if (stickId === e.pointerId) endStick(); });
  catcher.addEventListener('pointercancel', e => { if (stickId === e.pointerId) endStick(); });

  // ── drag to reposition ───────────────────────────────────────
  let drag = null;
  function startDrag(key, e) { drag = { key, id: e.pointerId }; els[key].setPointerCapture(e.pointerId); }
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
  window.addEventListener('deviceorientation', e => {
    if (!opts.tilt || mode === 'keyboard') return;
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    const landscape = Math.abs(angle) === 90 || Math.abs(angle) === 270;
    let raw = landscape ? e.beta : e.gamma;
    if (raw == null) return;
    if (angle === 270 || angle === -90) raw = -raw;
    if (tiltNeutral === null) tiltNeutral = raw;      // wherever you are holding it is centre
    const delta = (raw - tiltNeutral) / 30;
    padAxis(0, Math.max(-1, Math.min(1, delta * opts.tiltGain / 2.4)));
  });

  async function enableTilt(on) {
    if (on && typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        if (await DeviceOrientationEvent.requestPermission() !== 'granted') {
          on = false; alert('Motion access was denied, so tilt steering stays off.');
        }
      } catch (e) { on = false; }
    }
    opts.tilt = on; tiltNeutral = null;
    if (!on) padAxis(0, 0);
    saveOpts();
    return on;
  }

  // ── settings ─────────────────────────────────────────────────
  const menu = document.createElement('div');
  menu.id = 'tmenu';
  menu.innerHTML = `
    <div class="card">
      <div class="sticky">
        <h3>TOUCH CONTROLS</h3>
        <button id="t-close">CLOSE</button>
      </div>

      <div class="sub">
        The emulator has its own on-screen controls, which are wired straight into
        the core and need no mapping. This custom overlay is an alternative — turn it
        on only if you prefer it, since it covers theirs while active.
      </div>
      <div class="row">
        <button id="t-overlay" class="wide">CUSTOM OVERLAY</button>
      </div>

      <h3 style="margin-top:16px">BUTTON MAP</h3>
      <div class="sub">Only affects the custom overlay. AUTO MAP reads the emulator's own bindings.</div>
      <div class="row"><button id="t-auto" class="wide">AUTO MAP</button>
        <button id="t-mapreset" class="wide">RESET MAP</button></div>
      <div id="t-map"></div>

      <h3 style="margin-top:16px">INPUT PATH</h3>
      <div class="row">
        <button id="t-mboth" class="wide">BOTH</button>
        <button id="t-mpad"  class="wide">GAMEPAD</button>
        <button id="t-mkey"  class="wide">KEYBOARD</button>
      </div>
      <div class="diag" id="t-diag"></div>

      <h3 style="margin-top:16px">APPEARANCE</h3>
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
      <div class="note">
        A paired Bluetooth controller works regardless of any of this, and will
        beat glass for anything needing precise steering.
      </div>
    </div>`;
  document.body.appendChild(menu);

  const $ = id => menu.querySelector(id);

  // libretro's RetroPad button order, which is what EmulatorJS keys its
  // control table by. mupen64plus then maps RetroPad -> N64 internally.
  const RETRO_NAMES = {
    0:'B', 1:'Y', 2:'SELECT', 3:'START', 4:'UP', 5:'DOWN', 6:'LEFT', 7:'RIGHT',
    8:'A', 9:'X', 10:'L', 11:'R', 12:'L2', 13:'R2', 14:'L3', 15:'R3',
  };
  // best-known RetroPad slot for each N64 input
  const N64_TO_RETRO = { a: 8, b: 0, z: 12, l: 10, r: 11, start: 3 };

  function ejsControls() {
    const e = window.EJS_emulator;
    const c = e && e.controls && e.controls[0];
    return (c && typeof c === 'object') ? c : null;
  }

  function renderBindings() {
    const c = ejsControls();
    if (!c) return '<span style="color:#5a6b7f">emulator control table not readable yet</span>';
    const parts = [];
    Object.keys(RETRO_NAMES).forEach(i => {
      const b = c[i];
      if (!b) return;
      const k = b.value, g = b.value2;
      if (k == null && g == null) return;
      parts.push(RETRO_NAMES[i] + '=' + (k != null ? k : '·') + (g != null ? '/' + g : ''));
    });
    return parts.length ? parts.join('  ') : '<span style="color:#5a6b7f">nothing bound</span>';
  }

  function autoMap() {
    const c = ejsControls();
    if (!c) { alert('The emulator has not exposed its control table yet. Start the game first.'); return; }
    releaseAll();
    let filled = 0;
    CONTROLS.forEach(n => {
      const b = c[N64_TO_RETRO[n]];
      if (!b) return;
      if (b.value  != null) { MAP[n].key = String(b.value); filled++; }
      if (b.value2 != null && !isNaN(+b.value2)) MAP[n].pad = +b.value2;
    });
    saveMap(); renderMap();
    alert(filled ? ('Filled ' + filled + ' bindings from the emulator.')
                 : 'The control table had nothing usable in it.');
  }

  function renderDiag() {
    const seen = pollCount > 0;
    $('#t-diag').innerHTML =
      'gamepad polls: <b class="' + (seen ? '' : 'bad') + '">' + pollCount + '</b>' +
      (seen ? ' — pad path is live' : ' — nothing is reading the pad; KEYBOARD is the live path') +
      '<br><span style="color:#5a6b7f">emulator bindings:</span><br>' + renderBindings();
  }

  function renderMap() {
    const wrap = $('#t-map');
    wrap.innerHTML = '';
    CONTROLS.forEach(name => {
      const row = document.createElement('div');
      row.className = 'maprow';
      row.innerHTML =
        '<span class="nm">' + name.toUpperCase() + '</span>' +
        '<span class="tag">PAD</span>' +
        '<button class="step" data-t="pad" data-d="-1">−</button>' +
        '<span class="val">' + MAP[name].pad + '</span>' +
        '<button class="step" data-t="pad" data-d="1">+</button>' +
        '<span class="tag">KEY</span>' +
        '<button class="step" data-t="key" data-d="-1">−</button>' +
        '<span class="val">' + MAP[name].key + '</span>' +
        '<button class="step" data-t="key" data-d="1">+</button>';
      row.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        press(name, false);                         // let go of the old binding first
        const d = +b.dataset.d;
        if (b.dataset.t === 'pad') {
          MAP[name].pad = (MAP[name].pad + d + 17) % 17;
        } else {
          const i = KEY_CHOICES.indexOf(MAP[name].key);
          MAP[name].key = KEY_CHOICES[(i + d + KEY_CHOICES.length) % KEY_CHOICES.length];
        }
        saveMap(); renderMap();
      }));
      wrap.appendChild(row);
    });
  }

  function setMode(m) {
    releaseAll();          // nothing should stay held across a mode change
    mode = m; saveOpts(); syncMenu();
  }

  function syncMenu() {
    renderDiag(); renderMap();
    $('#t-op').value = opts.opacity;
    $('#t-tg').value = opts.tiltGain;
    $('#t-mboth').classList.toggle('on', mode === 'both');
    $('#t-mpad').classList.toggle('on',  mode === 'gamepad');
    $('#t-mkey').classList.toggle('on',  mode === 'keyboard');
    $('#t-tilt').classList.toggle('on', !!opts.tilt);
    $('#t-hap').classList.toggle('on', !!opts.haptics);
    $('#t-move').classList.toggle('on', editing);
    $('#t-move').textContent = editing ? 'DONE MOVING' : 'MOVE CONTROLS';
    $('#t-overlay').classList.toggle('on', !!opts.overlay);
    $('#t-overlay').textContent = opts.overlay ? 'CUSTOM OVERLAY: ON' : 'CUSTOM OVERLAY: OFF';
  }

  let diagTimer = null;
  gear.addEventListener('click', () => {
    syncMenu();
    menu.classList.add('on');
    diagTimer = setInterval(renderDiag, 500);      // watch the poll count live
  });

  function closeMenu() {
    menu.classList.remove('on');
    clearInterval(diagTimer); diagTimer = null;
  }

  $('#t-close').addEventListener('click', closeMenu);
  $('#t-mboth').addEventListener('click', () => setMode('both'));
  $('#t-mpad').addEventListener('click',  () => setMode('gamepad'));
  $('#t-mkey').addEventListener('click',  () => setMode('keyboard'));
  $('#t-op').addEventListener('input', e => { opts.opacity = +e.target.value; root.style.opacity = opts.opacity; saveOpts(); });
  $('#t-tg').addEventListener('input', e => { opts.tiltGain = +e.target.value; saveOpts(); });
  $('#t-hap').addEventListener('click', () => { opts.haptics = !opts.haptics; saveOpts(); syncMenu(); buzz(12); });
  $('#t-tilt').addEventListener('click', async () => { await enableTilt(!opts.tilt); syncMenu(); });
  $('#t-move').addEventListener('click', () => {
    editing = !editing;
    root.classList.toggle('edit', editing);
    root.style.opacity = editing ? 1 : opts.opacity;
    syncMenu();
    if (!editing) closeMenu();
  });
  $('#t-reset').addEventListener('click', () => {
    layout = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
    saveLayout(); place();
  });
  $('#t-auto').addEventListener('click', autoMap);
  $('#t-mapreset').addEventListener('click', () => {
    releaseAll();
    MAP = JSON.parse(JSON.stringify(DEFAULT_MAP));
    saveMap(); renderMap();
  });
  $('#t-overlay').addEventListener('click', () => showOverlay(!opts.overlay));

  window.addEventListener('resize', place);
  window.addEventListener('orientationchange', () => setTimeout(place, 250));
  window.addEventListener('blur', releaseAll);     // never leave an input stuck down

  // ── public API ───────────────────────────────────────────────
  function showOverlay(on) {
    opts.overlay = on; saveOpts();
    if (on) {
      enabled = true;
      root.classList.add('on'); root.classList.remove('off');
      place(); announce();
    } else {
      releaseAll();
      enabled = false;
      root.classList.remove('on'); root.classList.add('off');
    }
    if (menu.classList.contains('on')) syncMenu();
  }

  window.TouchPad = {
    show() {
      gear.style.display = 'block';
      showOverlay(!!opts.overlay);      // off unless previously turned on
    },
    hide() {
      releaseAll();
      enabled = false;
      root.classList.remove('on'); root.classList.add('off');
      gear.style.display = 'none';
    },
  };
})();
