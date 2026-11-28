# The hexagon ground floor's furnishing, draft 1 (for the owner's approval): every piece on a hex of the floor's grid (js/cardbattle.js THE HEXES), drawn on the approved map.
import json, math
from shapely.geometry import Polygon, Point
R = json.load(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), 'rooms.json')))
ROOMS = {r['id']: Polygon(r['polygon']) for r in R['rooms']}
DY = 86.48 / 20   # draft tiles to the game's tiles (js/hexfloormap.js place)
H = math.sqrt(3) / 2
def hx(x, y):   # the nearest hex middle of the floor's grid, in draft tiles
    wy = y + DY; r = round(wy / H); best = None
    for rr in (r - 1, r, r + 1):
        cx = round(x - (rr % 2) * 0.5) + (rr % 2) * 0.5; cy = rr * H - DY; d = math.hypot(cx - x, cy - y)
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
    hs = hexes_of(pts); best = None
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
json.dump([{'room': a, 'kind': b, 'label': c, 'hexes': d} for a, b, c, d in P], open('furnish.json', 'w'), indent=1)
# THE PICTURE
S = 22; W = 54 * S; Hh = 40 * S; T = lambda p: ((p[0] + 2) * S, (p[1] + 2) * S)
COL = {'R': '#4fb3ff', 'X': '#ffb347', 'N': '#7ee08a', 'C': '#ff7ac8'}
o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{Hh}"><rect width="100%" height="100%" fill="#0b1226"/>']
# the floor as one (no border between rooms: they run into each other), its outline the outer walls, and the owner's two walls inside it
from shapely.ops import unary_union
FL = unary_union([p.buffer(0.001) for p in ROOMS.values()]).buffer(-0.001)
o.append('<polygon points="%s" fill="#3a4458" stroke="#e9f2f4" stroke-width="4" stroke-linejoin="round"/>' % ' '.join('%.1f,%.1f' % T(p) for p in FL.exterior.coords))
_W = json.load(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), 'draft-5-chosen.json')))['walls']
for wl in _W: o.append('<polyline points="%s" fill="none" stroke="#e9f2f4" stroke-width="4" stroke-linecap="round"/>' % ' '.join('%.1f,%.1f' % T(p) for p in wl))
# the floor's hexes, faint
for rr in range(int(DY / H) - 2, int((34 + DY) / H) + 2):
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
    p = T((x, y)); o.append(f'<text x="{p[0]:.0f}" y="{p[1]:.0f}" font-family="DejaVu Sans" font-size="12" font-weight="bold" text-anchor="middle" fill="#cfe0ff" opacity="0.85">{NAMES[rid]}</text>')
# the key and the list
ky = 35.9
for i, (k, t) in enumerate([('R', "today's piece, back (a station or furniture of the old rooms)"), ('X', 'the six-sided cargo already built'), ('N', 'NEW six-sided piece (to model)'), ('C', 'NEW corner piece, shaped to fill a 60/120 degree corner')]):
    x0 = 1 + (i % 2) * 26; p = T((x0, ky + (i // 2) * 1.1))
    o.append(f'<rect x="{p[0]:.0f}" y="{p[1] - 10:.0f}" width="14" height="14" fill="{COL[k]}"/><text x="{p[0] + 20:.0f}" y="{p[1] + 2:.0f}" font-family="DejaVu Sans" font-size="11" fill="#cfe0ff">{t}</text>')
o.append('</svg>'); open('furnish.svg', 'w').write('\n'.join(o))
with open('furnish-list.txt', 'w') as f:
    for n, (room, k, label, hs) in enumerate(P): f.write(f'{n + 1:2d} [{k}] {NAMES[room]:18s} {label} ({len(hs)} hex{"es" if len(hs) > 1 else ""})\n')
