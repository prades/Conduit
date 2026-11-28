# THE HEXAGON GROUND FLOOR's rooms (docs/FACILITY.md, "The hexagon ground floor"): the approved draft 5 (draft-5-chosen.json, in tiles) cut into the game's rooms.
# Each cut is a straight line between two areas: "open" where the areas run into each other with no wall, "wall" where the owner drew one. Every edge on the outline is a wall.
# Writes rooms.json (tiles); tools/hexfloor.js makes js/hexfloormap.js from it. Run: python3 rooms.py (needs shapely).
import json, math, os
from shapely.geometry import Polygon, LineString, Point
from shapely.ops import unary_union, polygonize
from shapely import set_precision
HERE = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(HERE, 'draft-5-chosen.json')))
O = [tuple(p) for p in d['outline']]; (A, P1), (J, LEND) = [tuple(map(tuple, w)) for w in d['walls']]
k = 1 / math.sqrt(3)
def at(x, y):   # the outline's corner nearest (x, y)
    i = min(range(len(O)), key=lambda i: math.hypot(O[i][0] - x, O[i][1] - y)); assert math.hypot(O[i][0] - x, O[i][1] - y) < 0.2, (x, y); return i
def left_x(y):   # the outline's west side between corners 28 and 29, and 27 and 28
    for i, j in ((at(0, 5.68), at(6.47, 16.89)), (at(6.47, 16.89), at(0.03, 28.05))):
        if min(O[i][1], O[j][1]) <= y <= max(O[i][1], O[j][1]): return O[i][0] + (y - O[i][1]) * (O[j][0] - O[i][0]) / (O[j][1] - O[i][1])
def east(y):   # where the line across at y meets the outline's east side
    xs = [p0[0] + (y - p0[1]) * (p1[0] - p0[0]) / (p1[1] - p0[1]) for p0, p1 in zip(O, O[1:] + O[:1]) if p0[1] != p1[1] and min(p0[1], p1[1]) <= y <= max(p0[1], p1[1])]
    return (max(xs), y)
Q = O[at(8.31, 24.89)]   # the blocked wedge's south-west corner (after R, J, P1)
assert abs(Q[0] - 8.31) < 0.1, Q
CUTS = [   # (from, to, kind)
    (O[at(8.79, 5.44)], A, 'open'),                                   # 1 and 8 | 2: the way from the Crystal Chamber and the stairs hallway into the Server Room
    ((left_x(A[1]), A[1]), A, 'open'),                   # 1 | 8
    (A, P1, 'wall'),                                     # 8 | 2: the diagonal wall
    ((left_x(Q[1]), Q[1]), Q, 'open'),                   # 8 | 7: the hallway into the way to the Observation Deck
    (J, LEND, 'wall'),                                   # 2 | 6: the lounge wall
    (LEND, east(LEND[1]), 'open'),                       # 2 and 4 | 6 and 5
    (O[at(34.35, 12.94)], (O[at(34.35, 12.94)][0], LEND[1]), 'open'),                  # 2 | 4: from the blocked-off notch's south-east corner
    (O[at(36.39, 29.19)], (O[at(36.39, 29.19)][0], LEND[1]), 'open'),                # 6 | 5: from the notch in the south wall
]
LOUNGE = (P1[0] + 3.2, 16.0, LEND[0] - 0.4, LEND[1])    # the Lounge: north of the lounge wall (its size provisional)
CUTS += [((LOUNGE[0], LOUNGE[1]), (LOUNGE[2], LOUNGE[1]), 'open'), ((LOUNGE[0], LOUNGE[1]), (LOUNGE[0], LOUNGE[3]), 'open'), ((LOUNGE[2], LOUNGE[1]), (LOUNGE[2], LOUNGE[3]), 'open')]
AREAS = [   # id, label, a point inside
    ('hx_crystal_chamber', 'Crystal Chamber', (5, 6)), ('hx_server_room', 'Server Room', (20, 6)), ('hx_warehouse', 'Warehouse', (41, 8)),
    ('hx_stairs_up', 'Stairs Up', (43, 25)), ('hx_main_hallway', 'Main Hallway', (25, 25)), ('hx_observation_way', 'Way to the Observation Deck', (5, 29)),
    ('hx_stairs_hallway', 'Stairs Hallway', (7, 18)), ('hx_lounge', 'Lounge', (24, 18)),
]
def ext(a, b, e=0.02):   # a cut a little longer at both ends, so it meets the outline
    dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy); return LineString([(a[0] - dx / L * e, a[1] - dy / L * e), (b[0] + dx / L * e, b[1] + dy / L * e)])
# every cut's end that lies on the outline's edge made a corner of it, so the cuts meet the outline exactly (no cut need run past its end)
def _insert(V, q):
    for i in range(len(V)):
        p0, p1 = V[i], V[(i + 1) % len(V)]
        if any(math.hypot(q[0] - v[0], q[1] - v[1]) < 1e-6 for v in (p0, p1)): return V
        if LineString([p0, p1]).distance(Point(q)) < 1e-6: return V[:i + 1] + [q] + V[i + 1:]
    return V
for a_, b_, _ in CUTS: O = _insert(_insert(O, a_), b_)
# the outline and every cut, noded where they meet, made into faces (a cut may end at another cut's end, inside the floor)
lines = set_precision(unary_union([LineString(O + [O[0]])] + [LineString([a, b]) for a, b, _ in CUTS]), 1e-6)   # (on a fine grid, so cuts meeting at a point inside the floor share it)
pieces = [p for p in polygonize(lines) if Polygon(O).buffer(1e-6).contains(p)]
def on(seg, p, q, tol=0.05):   # the edge p-q lies along the cut seg
    s = LineString(seg); return s.distance(Point(p)) < tol and s.distance(Point(q)) < tol
rooms = []
for rid, label, pt in AREAS:
    hits = [p for p in pieces if p.contains(Point(pt))]; assert len(hits) == 1, (rid, len(hits))
    P = hits[0]; V = list(P.exterior.coords)[:-1]
    if P.exterior.is_ccw: V = V[::-1]
    def kinds_of(V):
        out = []
        for i in range(len(V)):
            p, q = V[i], V[(i + 1) % len(V)]; kind = 'wall'
            for a, b, ck in CUTS:
                if on((a, b), p, q): kind = ck; break
            out.append(kind)
        return out
    kinds = kinds_of(V)
    merged = True   # a corner on a straight run is taken out when the two edges either side of it are of one kind
    while merged:
        merged = False
        for i in range(len(V)):
            p0, p1, p2 = V[i - 1], V[i], V[(i + 1) % len(V)]
            if kinds[i - 1] == kinds[i] and abs((p1[0] - p0[0]) * (p2[1] - p1[1]) - (p1[1] - p0[1]) * (p2[0] - p1[0])) < 1e-6:
                V = V[:i] + V[i + 1:]; kinds = kinds[:i] + kinds[i + 1:]; kinds[i - 1] = kinds[i - 1]; merged = True; break
    rooms.append({'id': rid, 'label': label, 'polygon': [[round(x, 3), round(y, 3)] for x, y in V], 'edge_kinds': kinds})
left = [p for p in pieces if not any(p.contains(Point(pt)) for _, _, pt in AREAS)]
assert not left, 'pieces with no area: %d' % len(left)
json.dump({'rooms': rooms, 'lounge': LOUNGE}, open(os.path.join(HERE, 'rooms.json'), 'w'), indent=1)
for r in rooms: print(r['id'], len(r['polygon']), 'corners', round(Polygon(r['polygon']).area), 'tiles', r['edge_kinds'].count('open'), 'open edges')
