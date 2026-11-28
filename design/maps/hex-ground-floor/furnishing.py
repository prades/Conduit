# THE HEXAGON GROUND FLOOR'S FURNISHING (docs/FACILITY.md, "The hexagon ground floor"; the layout approved 2026-11-28, "Good to go"; the new pieces' drafts approved, "Sure"): every piece on
# hexes of the game's floor grid (js/cardbattle.js THE HEXES), in the game's own frame: the rooms' corners as the game snaps them (js/facility.js _facP), so nothing drifts off its hex or into a wall.
# Writes furnishing.json (the props, stations and the electrical domain's door, in sketch px, for tools/hexfloor.js) and furnishing.png (the plan, drawn from the same data). Run: python3 furnishing.py
import json, math, os
from shapely.geometry import Polygon, Point
HERE = os.path.dirname(os.path.abspath(__file__))
R = json.load(open(os.path.join(HERE, 'rooms.json')))
PLACE = 760 - max(p[1] for r in R['rooms'] for p in r['polygon']) * 20   # (tools/hexfloor.js: its south wall on y = 760)
snapw = lambda v: math.floor(v) + 0.5   # (a corner as the game snaps it: Math.round(px / 20 - 0.5) + 0.5)
ROOMS = {r['id']: Polygon([(snapw(p[0]), snapw(p[1] + PLACE / 20)) for p in r['polygon']]) for r in R['rooms']}
OFF = (0.5, PLACE / 20 + 0.5)   # (a point of the drawn plan, in draft tiles, to the game's world tiles)
DY = 0
H = math.sqrt(3) / 2
def hx(x, y):   # the nearest hex middle of the floor's grid, in world tiles
    r = round(y / H); best = None
    for rr in (r - 1, r, r + 1):
        cx = round(x - (rr % 2) * 0.5) + (rr % 2) * 0.5; cy = rr * H; d = math.hypot(cx - x, cy - y)
        if best is None or d < best[0]: best = (d, cx, cy)
    return best[1], best[2]
# kind: R today's piece back (a station or furniture the old rooms had), X the new six-sided cargo already built, N a new six-sided piece to model, C a new corner piece shaped to a 60 or 120 degree corner
P = []
def hexes_of(pts):   # a piece's hexes: its first point snapped, the rest kept in the same hex offsets (rows a hex apart, x a hex apart along a row)
    x0, y0 = hx(*pts[0]); r0 = round((y0 + DY) / H); out = []
    for (x, y) in pts:
        dr = round((y - pts[0][1]) / H); r = r0 + dr; xx = x0 + round(x - pts[0][0] - ((r % 2) - (r0 % 2)) * 0.5) + ((r % 2) - (r0 % 2)) * 0.5
        out.append((xx, r * H - DY))
    return out
TAKEN = set()
def ok_at(room, hs, wall):
    poly = ROOMS[room]
    for (x, y) in hs:
        pt = Point(x, y)
        if not poly.contains(pt) or poly.exterior.distance(pt) < wall or (round(x, 2), round(y, 2)) in TAKEN: return False
    return True
def add(room, kind, label, pts, wall=0.42):
    pts = [(x + OFF[0], y + OFF[1]) for (x, y) in pts]; hs = hexes_of(pts); best = None
    for ring in range(0, 4):   # the nearest shift, in hexes, that puts every hex of it on floor, off the walls and on no other piece
        for dq in range(-ring, ring + 1):
            for dr in range(-ring, ring + 1):
                if max(abs(dq), abs(dr)) != ring: continue
                cand = []
                for (x, y) in hs:
                    r = round((y + DY) / H) + dr; cx = x + dq + ((r % 2) - ((r - dr) % 2)) * 0.5; cand.append((cx, r * H - DY))
                if ok_at(room, cand, wall): best = cand; break
            if best: break
        if best: break
    if not best: print('NO ROOM FOR', room, label); return
    for (x, y) in best: TAKEN.add((round(x, 2), round(y, 2)))
    P.append((room, kind, label, best))
# 1 THE CRYSTAL CHAMBER
add('crystal_chamber', 'R', 'Crystal in its tank', [(5.4, 6.6)])
add('crystal_chamber', 'R', 'generator', [(7.0, 3.3)])
add('crystal_chamber', 'R', 'console', [(3.2, 3.3)])
add('crystal_chamber', 'R', 'tuning bench (was Teleport Room 1)', [(2.1, 8.0), (3.1, 8.0)])
add('crystal_chamber', 'R', 'sentry', [(8.6, 9.6)])
add('crystal_chamber', 'C', 'corner relay cabinet', [(1.0, 5.6)])
# 2 THE SERVER ROOM
# (the owner, 2026-11-28, drawing four strokes across the room: "Diagonal server rack like this": four rows down the floor's 60 degree line, as its slanted walls run)
for (x0, y0, n) in ((12.3, 4.4, 7), (14.4, 3.7, 8), (18.3, 3.1, 6), (22.0, 3.4, 5)):
    add('front_lobby', 'N', 'server racks (a diagonal row)', [(x0 + 0.5 * i, y0 + H * i) for i in range(n)])
add('front_lobby', 'R', 'junction (the electrical domain\'s door beside it)', [(18.5, 0.9)])
add('front_lobby', 'N', 'stair door down to the electrical domain', [(19.5, 0.9)])
add('front_lobby', 'R', 'console', [(24.5, 10.3)])
add('front_lobby', 'C', 'corner cooling unit', [(12.8, 0.9)])
add('front_lobby', 'C', 'corner cooling unit', [(24.8, 0.9)])
add('front_lobby', 'C', 'corner cooling unit', [(26.9, 9.0)])
add('front_lobby', 'R', 'relay node', [(13.4, 12.2)])
# THE LOUNGE
add('lounge', 'N', 'sofa', [(19, 16.8), (20, 16.8)])
add('lounge', 'N', 'sofa', [(23.5, 16.8), (24.5, 16.8)])
add('lounge', 'N', 'coffee table', [(21.5, 18.4)])
add('lounge', 'R', 'beanbags', [(19.0, 18.8), (26.0, 18.8), (27.0, 18.8)])
add('lounge', 'N', 'coffee machine', [(27.5, 16.8)])
add('lounge', 'R', 'whiteboard', [(29.0, 17.4)])
add('lounge', 'R', 'plant', [(17.8, 18.8)])
# 4 THE WAREHOUSE
add('show_room', 'N', 'pallet racks', [(x, 1.2) for x in (38.5, 39.5, 40.5, 41.5, 42.5)])
add('show_room', 'N', 'pallet racks', [(47.5, 6.5), (48.0, 7.4), (48.5, 8.3)])
add('show_room', 'R', 'mech bay', [(41.5, 9.2), (42.5, 9.2), (41.0, 10.1), (42.0, 10.1), (43.0, 10.1), (41.5, 11.0), (42.5, 11.0)])
add('show_room', 'X', 'six-sided crates', [(36.5, 15.6), (37.5, 15.6), (37.0, 16.5)])
add('show_room', 'X', 'six-sided barrels', [(44.0, 16.5), (45.0, 16.5)])
add('show_room', 'R', 'cart', [(40.0, 17.4)])
add('show_room', 'R', 'locker', [(35.4, 5.8)])
add('show_room', 'C', 'corner shelving', [(49.3, 11.3)])
add('show_room', 'C', 'corner shelving', [(37.9, 0.9)])
# 5 THE STAIRS UP
add('hx_stairs_up', 'N', 'staircase up (barred: the floor above is not built)', [(44.0, 25.5), (45.0, 25.5), (44.5, 26.4), (45.5, 26.4), (44.0, 27.3), (45.0, 27.3)])
add('hx_stairs_up', 'R', 'floodlight', [(38.0, 21.0)])
add('hx_stairs_up', 'X', 'six-sided crate stack', [(40.5, 31.2)])
add('hx_stairs_up', 'C', 'corner floodlight', [(48.8, 26.5)])
# 6 THE MAIN HALLWAY (the middle kept open for battles; the arena door's stretch kept clear)
add('lab_hallway', 'R', 'charger', [(35.4, 20.9)])
add('lab_hallway', 'R', 'vending machine', [(28.5, 20.8)])
add('lab_hallway', 'R', 'cooler', [(27.4, 20.8)])
add('lab_hallway', 'R', 'bin', [(26.3, 20.8)])
add('lab_hallway', 'R', 'floodlight', [(14.4, 31.8)])
add('lab_hallway', 'R', 'floodlight', [(35.4, 28.0)])
add('lab_hallway', 'R', 'sentry', [(35.4, 24.5)])
add('lab_hallway', 'N', 'bench', [(29.5, 25.0), (30.5, 25.0)])
add('lab_hallway', 'C', 'corner planter', [(11.9, 29.4)])
add('lab_hallway', 'C', 'corner planter', [(24.6, 30.6)])
# 7 THE WAY TO THE OBSERVATION DECK
add('hx_observation_way', 'N', 'stairs up to the deck (its stairwell)', [(5.0, 31.9), (6.0, 31.9)])
add('hx_observation_way', 'C', 'corner planter', [(1.0, 28.0)])
add('hx_observation_way', 'C', 'corner planter', [(9.3, 28.5)])
# 8 THE STAIRS HALLWAY
add('hx_stairs_hallway', 'N', 'railing round the stairwell down', [(6.5, 18.2), (9.5, 18.2), (6.0, 19.9), (10.0, 19.9)])
add('hx_stairs_hallway', 'R', 'floodlight', [(4.4, 12.3)])
add('hx_stairs_hallway', 'C', 'corner planter', [(2.8, 24.0)])
# CHECK: every hex on floor, in its room, a little off the walls; none two to a hex
seen = {}; bad = []
for room, k, label, hs in P:
    for (x, y) in hs:
        pt = Point(x, y); poly = ROOMS[room]
        if not poly.contains(pt) or poly.exterior.distance(pt) < 0.42: bad.append((room, label, round(x, 2), round(y, 2), round(poly.exterior.distance(pt), 2) if poly.contains(pt) else 'outside'))
        key = (round(x, 2), round(y, 2))
        if key in seen: bad.append(('twice', label, seen[key]))
        seen[key] = label
for b in bad: print('BAD', b)
print(len(P), 'pieces,', sum(len(h) for _, _, _, h in P), 'hexes;', {k: sum(1 for p in P if p[1] == k) for k in 'RXNC'})
# THE PICTURE
S = 22; W = 54 * S; Hh = 40 * S; T = lambda p: ((p[0] - OFF[0] + 2) * S, (p[1] - OFF[1] + 2) * S)   # (world tiles to the picture)
COL = {'R': '#4fb3ff', 'X': '#ffb347', 'N': '#7ee08a', 'C': '#ff7ac8'}
o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{Hh}"><rect width="100%" height="100%" fill="#0b1226"/>']
# the floor as one (no border between rooms: they run into each other), its outline the outer walls, and the owner's two walls inside it
from shapely.ops import unary_union
FL = unary_union([p.buffer(0.001) for p in ROOMS.values()]).buffer(-0.001)
o.append('<polygon points="%s" fill="#3a4458" stroke="#e9f2f4" stroke-width="4" stroke-linejoin="round"/>' % ' '.join('%.1f,%.1f' % T(p) for p in FL.exterior.coords))
_W = json.load(open(os.path.join(HERE, 'draft-5-chosen.json')))['walls']
for wl in _W: o.append('<polyline points="%s" fill="none" stroke="#e9f2f4" stroke-width="4" stroke-linecap="round"/>' % ' '.join('%.1f,%.1f' % T((p[0] + OFF[0], p[1] + OFF[1])) for p in wl))
# the floor's hexes, faint
for rr in range(int(OFF[1] / H) - 2, int((34 + OFF[1]) / H) + 2):
    for q in range(-1, 52):
        cx = q + (rr % 2) * 0.5; cy = rr * H - DY
        if any(p.contains(Point(cx, cy)) for p in ROOMS.values()):
            pts = [T((cx + 0.5 * math.cos(math.pi / 6 + i * math.pi / 3) / math.cos(math.pi / 6) * 0.98, cy + 0.5 * math.sin(math.pi / 6 + i * math.pi / 3) / math.cos(math.pi / 6) * 0.98)) for i in range(6)]
            o.append('<polygon points="%s" fill="none" stroke="#56627a" stroke-width="0.8"/>' % ' '.join('%.1f,%.1f' % p for p in pts))
for n, (room, k, label, hs) in enumerate(P):
    for (x, y) in hs:
        pts = [T((x + 0.5 * math.cos(math.pi / 6 + i * math.pi / 3) / math.cos(math.pi / 6) * 0.9, y + 0.5 * math.sin(math.pi / 6 + i * math.pi / 3) / math.cos(math.pi / 6) * 0.9)) for i in range(6)]
        o.append('<polygon points="%s" fill="%s" stroke="#0b1226" stroke-width="1.5"/>' % (' '.join('%.1f,%.1f' % p for p in pts), COL[k]))
    cx = sum(h[0] for h in hs) / len(hs); cy = sum(h[1] for h in hs) / len(hs); p = T((cx, cy))
    o.append(f'<text x="{p[0]:.0f}" y="{p[1] + 4:.0f}" font-family="DejaVu Sans" font-size="11" font-weight="bold" text-anchor="middle" fill="#0b1226">{n + 1}</text>')
NAMES = {'crystal_chamber': '1 CRYSTAL CHAMBER', 'front_lobby': '2 SERVER ROOM', 'show_room': '4 WAREHOUSE', 'hx_stairs_up': '5 STAIRS UP', 'lab_hallway': '6 MAIN HALLWAY', 'hx_observation_way': '7 TO THE DECK', 'hx_stairs_hallway': '8 STAIRS DOWN', 'lounge': 'LOUNGE'}
LBL = {'crystal_chamber': (5, 1.2), 'front_lobby': (19, 10.5), 'show_room': (42, 4), 'hx_stairs_up': (42, 22.5), 'lab_hallway': (22, 27.5), 'hx_observation_way': (5, 27.0), 'hx_stairs_hallway': (6, 14.2), 'lounge': (23.5, 15.4)}
for rid, (x, y) in LBL.items():
    p = T((x + OFF[0], y + OFF[1])); o.append(f'<text x="{p[0]:.0f}" y="{p[1]:.0f}" font-family="DejaVu Sans" font-size="12" font-weight="bold" text-anchor="middle" fill="#cfe0ff" opacity="0.85">{NAMES[rid]}</text>')
# the key and the list
ky = 35.9 + OFF[1]
for i, (k, t) in enumerate([('R', "today's piece, back (a station or furniture of the old rooms)"), ('X', 'the six-sided cargo already built'), ('N', 'NEW six-sided piece (to model)'), ('C', 'NEW corner piece, shaped to fill a 60/120 degree corner')]):
    x0 = 1 + OFF[0] + (i % 2) * 26; p = T((x0, ky + (i // 2) * 1.1))
    o.append(f'<rect x="{p[0]:.0f}" y="{p[1] - 10:.0f}" width="14" height="14" fill="{COL[k]}"/><text x="{p[0] + 20:.0f}" y="{p[1] + 2:.0f}" font-family="DejaVu Sans" font-size="11" fill="#cfe0ff">{t}</text>')
o.append('</svg>'); open(os.path.join(HERE, 'furnishing.svg'), 'w').write('\n'.join(o))

# ═════════ THE GAME'S DATA (furnishing.json; tools/hexfloor.js puts it in js/hexfloormap.js) ═════════
# what each piece is in the game: a kind with a sheet (js/propsprites.js PS_FAMILY), one prop a hex (a row of racks is so many racks) or one for its hexes together (a sofa, the mech bay);
# today's pieces with their stations keep today's ids, so the game's stations and what names them hold (the junction opens the electrical domain's door, the mech bay, the charger, the tuning bench)
KIND = {   # label -> (kind, one prop a hex?, id for a station's prop, station kind)
    'generator': ('generator', 1), 'console': ('console', 1), 'tuning bench (was Teleport Room 1)': ('console', 0, 'console_2', 'tune_bench'), 'sentry': ('sentry', 1),
    'junction (the electrical domain\'s door beside it)': ('junction', 0, 'junction', 'junction'), 'stair door down to the electrical domain': ('hexhatch', 0),
    'server racks (a diagonal row)': ('hexrack', 1), 'sofa': ('hexsofa', 0), 'coffee table': ('hextable', 1), 'beanbags': ('beanbag', 1), 'coffee machine': ('hexcoffee', 1),
    'whiteboard': ('whiteboard_stand', 1), 'plant': ('plant', 1), 'pallet racks': ('hexpallet', 1), 'mech bay': ('mech_bay', 0, 'mech_bay', 'mech_bay'),
    'six-sided crates': ('hexcrate', 1), 'six-sided barrels': ('hexbarrel', 1), 'cart': ('cart', 1), 'locker': ('locker', 1),
    'staircase up (barred: the floor above is not built)': ('hexstairs', 0), 'floodlight': ('floodlight', 1), 'six-sided crate stack': ('hexcrate_stack', 1),
    'charger': ('charger', 0, 'charger_hall', 'charger'), 'vending machine': ('vending', 1), 'cooler': ('cooler', 1), 'bin': ('bin', 1), 'bench': ('hexbench', 0),
    'railing round the stairwell down': ('hexrail', 1),
}
SKIP = {'Crystal in its tank', 'relay node', 'stairs up to the deck (its stairwell)'}   # (the Crystal is the chamber's objective, moved onto its hex; the relay waits for the relays; the deck's stairs are its stairwell)
CORNER = {'corner relay cabinet': 'hexrelay', 'corner cooling unit': 'hexcool', 'corner shelving': 'hexshelf', 'corner floodlight': 'hexflood', 'corner planter': 'hexplanter'}
HEXP = lambda x, y, r=0.47: [(x + r * math.sin(i * math.pi / 3), y + r * math.cos(i * math.pi / 3)) for i in range(6)]
topx = lambda p: [round((p[0] - 0.5) * 20, 2), round((p[1] - 0.5) * 20 - PLACE + PLACE, 2)]   # (world tiles to sketch px, as a prop's outline is read: px / 20 + 0.5)
props, stations, used, ids = [], [], set(), {}
def pid(base): ids[base] = ids.get(base, 0) + 1; return 'hx_' + base + '_' + str(ids[base])
FL = Polygon(ROOMS['crystal_chamber'])
from shapely.ops import unary_union
OUT = unary_union([p.buffer(0.001) for p in ROOMS.values()]).buffer(-0.001).exterior.coords[:-1]
crystal = None
for room, k, label, hs in P:
    if label in SKIP:
        if label == 'Crystal in its tank': crystal = topx(hs[0])
        continue
    if label in CORNER:   # its corner: the floor's corner nearest it; the piece's own corner set into it, turned so it opens along the corner's bisector
        x, y = hs[0]; V = min(range(len(OUT)), key=lambda i: math.hypot(OUT[i][0] - x, OUT[i][1] - y)); c = OUT[V]; a = OUT[V - 1]; b = OUT[(V + 1) % len(OUT)]
        da = (a[0] - c[0], a[1] - c[1]); db = (b[0] - c[0], b[1] - c[1]); la = math.hypot(*da); lb = math.hypot(*db); da = (da[0] / la, da[1] / la); db = (db[0] / lb, db[1] / lb)
        ang = math.degrees(math.acos(max(-1, min(1, da[0] * db[0] + da[1] * db[1])))); shape = 60 if ang < 90 else 120
        bi = (da[0] + db[0], da[1] + db[1]); bl = math.hypot(*bi); bi = (bi[0] / bl, bi[1] / bl)
        if not Polygon(OUT).contains(Point(c[0] + bi[0] * 0.3, c[1] + bi[1] * 0.3)): print('  (no corner to fill by', label, 'at', round(x, 1), round(y, 1), ': the wall turns outward there; left out)'); continue
        rr = round(math.degrees(math.atan2(bi[1], bi[0])) / 30) % 12; phi = math.radians(rr * 30)
        F = [(0, 0), (0.9 * math.cos(math.pi / 6), -0.45), (0.9 * math.cos(math.pi / 6), 0.45)] if shape == 60 else [(0, 0), (0.45, -0.78), (0.9, 0), (0.45, 0.78)]
        F = [(c[0] + bi[0] * 0.05 + px * math.cos(phi) - pz * math.sin(phi), c[1] + bi[1] * 0.05 + px * math.sin(phi) + pz * math.cos(phi)) for (px, pz) in F]
        kind = CORNER[label] + str(shape) + 'r' + str(rr); used.add(kind)
        props.append({'id': pid(CORNER[label][3:]), 'room': room, 'shape': 'poly', 'poly': [topx(q) for q in F], 'status': 'placed', 'kind': kind, 'corner': [shape, rr]}); continue
    kd = KIND[label]; kind = kd[0]
    if kd[1]:
        for (x, y) in hs: props.append({'id': pid(kind), 'room': room, 'shape': 'poly', 'poly': [topx(q) for q in HEXP(x, y)], 'status': 'placed', 'kind': kind})
    else:
        xs = [h[0] for h in hs]; ys = [h[1] for h in hs]; x0, x1, y0, y1 = min(xs) - 0.47, max(xs) + 0.47, min(ys) - 0.45, max(ys) + 0.45
        if kind in ('hexsofa', 'hexbench'): y0, y1 = (y0 + y1) / 2 - 0.3, (y0 + y1) / 2 + 0.36
        pr = {'id': kd[2] if len(kd) > 2 else pid(kind), 'room': room, 'shape': 'poly', 'poly': [topx(q) for q in [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]], 'status': 'placed', 'kind': kind}
        props.append(pr)
        if len(kd) > 3: stations.append({'id': 'st_' + kd[3], 'room': room, 'prop': kd[2], 'kind': kd[3]})
# the electrical domain's door: in front of the hatch, shut until the junction is repaired (as today's, js/facilityportals.js)
hatch = next(p for p in props if p['kind'] == 'hexhatch'); hx0 = sum(q[0] for q in hatch['poly']) / 4 / 20 + 0.5; hy0 = sum(q[1] for q in hatch['poly']) / 4 / 20 + 0.5
door = {'id': 'portal_lobby_elec', 'room': 'front_lobby', 'rect': [topx((hx0 - 0.5, hy0 + 0.55))[0], topx((hx0 - 0.5, hy0 + 0.55))[1], topx((hx0 + 0.5, hy0 + 1.4))[0], topx((hx0 + 0.5, hy0 + 1.4))[1]],
        'arrive': topx((hx0, hy0 + 2.2)), 'to': 'portal_elec_lobby', 'label': 'ELECTRICAL DOMAIN', 'kind': 'stairs_down', 'needs': 'junction', 'well': True,
        'note': 'The stair door down to the electrical domain: the hooded hatch in the Server Room beside the junction. Shut until the junction is repaired.'}
json.dump({'props': props, 'stations': stations, 'crystal': crystal, 'portals': [door], 'connections': [{'id': 'conn_lobby_elec', 'rooms': ['front_lobby', 'elec_servers'], 'portal': 'portal_lobby_elec'}], 'cornerKinds': sorted(used)},
          open(os.path.join(HERE, 'furnishing.json'), 'w'), indent=1)
print(len(props), 'props,', len(stations), 'stations; corner kinds:', ' '.join(sorted(used)))
