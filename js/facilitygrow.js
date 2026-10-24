// ─────────────────────────────────────────────────────────
//  THE WALL-THICKNESS PASS: the building is spaced out so every wall between two rooms is a solid band ONE TILE thick
// ─────────────────────────────────────────────────────────
// js/facilitymap.js is the SKETCH layout: rooms touch, so a wall between two of them is a line. This pass runs once at load, before the map is compiled, and makes the building as it is BUILT:
//   - rooms are slid apart so that wherever two rooms shared a solid wall there is now a one-tile gap: the wall's thickness (a wall is a band of solid between the rooms' edges);
//   - every room keeps its interior size (the hallway stays six tiles wide); the facility simply gets a little bigger;
//   - a door between two such rooms is a one-tile tunnel through the band (it is cut into one room's outline, so the existing door logic is unchanged);
//   - props, decor, fixtures and ramps move with their room; doors, windows and the stairs are re-placed by hand below.
// Glass (the lab's and the show room's windows) and the open stair mouth stay a thin line: no band there.
// Everything is in sketch pixels (20 to a tile). The table below is the whole layout change: edit it and nothing else.

(function () {
    if (typeof FACILITY_MAP === "undefined" || FACILITY_MAP._grown) return;
    const M = FACILITY_MAP, G = 20;   // G: one tile in sketch pixels, the wall's thickness
    M._grown = true;

    // how far each room slides, in tiles: [x, y]. The hallway, the lab and the passage hold their ground (the hub); the others move away from them.
    const SHIFT = {
        crystal_chamber: [-1, -1], teleport_room_1: [-1, 0], front_lobby: [-1, -1], security_room: [0, -1], show_room: [1, 0], armory: [-1, 2],
        teleport_stair_room: [0, 1], teleport_room_2: [1, 1], observation_deck: [0, 1], catwalks: [0, 1], arena: [0, 1], nest_area: [0, 1],
    };
    const sh = (id) => SHIFT[id] || [0, 0];
    const mv = (p, t) => [p[0] + t[0] * G, p[1] + t[1] * G];

    // outlines that are re-drawn rather than slid (their shapes change): Teleport Room 1 loses the nub beside the lab; the passage is one tile shorter; the hallway gives up a row at its
    // north-west corner and gains a column on its east side (against the show room's glass)
    const POLY = {
        teleport_room_1: [[165, 500], [350, 500], [350, 550], [290, 550], [290, 760], [165, 760]],
        teleport_stair_room: [[870, 620], [945, 620], [945, 760], [870, 760]],   // one row shorter, so its west wall ends where the hallway's does (no stub of wall beside the steps)
        lab_passage: [[310, 565], [410, 565], [410, 605], [310, 605]],
        lab_hallway: [[370, 410], [950, 410], [950, 600], [870, 600], [870, 760], [310, 760], [310, 630], [430, 630], [430, 640], [750, 640], [750, 530], [430, 530], [370, 530]],
    };
    const edgeKinds = (room) => room.edge_kinds;

    for (const r of M.rooms) {
        const t = sh(r.id);
        if (POLY[r.id]) r.polygon = POLY[r.id].map(p => p.slice()); else r.polygon = r.polygon.map(p => mv(p, t));
        for (const o of (r.objects || [])) if (o.at) o.at = mv(o.at, t);
    }
    for (const p of M.props) { const t = sh(p.room); if (p.rect) p.rect = [p.rect[0] + t[0] * G, p.rect[1] + t[1] * G, p.rect[2] + t[0] * G, p.rect[3] + t[1] * G]; if (p.at) p.at = mv(p.at, t); }
    for (const d of (M.decor || [])) {
        const t = sh(d.room); if (!t[0] && !t[1]) continue;
        if (d.at) d.at = mv(d.at, t); if (Array.isArray(d.a)) d.a = mv(d.a, t); if (Array.isArray(d.b)) d.b = mv(d.b, t);   // (a light's `a` is its strength, a number: only a wall decor's ends are points)
        if (d.rect) d.rect = [d.rect[0] + t[0] * G, d.rect[1] + t[1] * G, d.rect[2] + t[0] * G, d.rect[3] + t[1] * G]; if (d.path) d.path = d.path.map(p => mv(p, t));
    }
    // decor that hung on a wall or lay on a floor that has moved: the hallway's north-west corner is one row smaller, and Teleport Room 1 lost the nub
    for (const d of (M.decor || [])) {
        if (d.room === "lab_hallway" && d.a && d.b && d.a[1] === 610 && d.b[1] === 610) { d.a = [d.a[0], 630]; d.b = [d.b[0], 630]; }   // the hallway's west-strip top wall is now at y = 31.5
        if (d.room === "lab_hallway" && d.path) d.path = d.path.map(q => q[0] < 430 && q[1] > 540 && q[1] < 645 ? [q[0], 645] : q);
        if (d.id === "debris_2") d.at = [310, 530];
    }
    for (const f of (M.fixtures || [])) { const t = sh(f.room); f.a = mv(f.a, t); f.b = mv(f.b, t); }
    for (const p of (M.pickups || [])) p.at = mv(p.at, sh(p.room));
    for (const e of (M.external_exits || [])) e.at = mv(e.at, sh(e.room));
    for (const c of ((M.candidates && M.candidates.connections) || [])) c.at = mv(c.at, sh(c.rooms[0]));
    for (const c of ((M.candidates && M.candidates.ramps) || [])) c.at = mv(c.at, [0, 1]);

    // windows: the show room's glass moves with it; the deck's glass with the deck and the arena; the lab's lower west pane now looks onto the shorter hallway corner
    for (const w of M.windows) {
        if (/^show_/.test(w.id)) { w.a = mv(w.a, [1, 0]); w.b = mv(w.b, [1, 0]); }
        else if (/^deck_window_arena/.test(w.id)) { w.a = mv(w.a, [0, 1]); w.b = mv(w.b, [0, 1]); }
        else if (w.id === "lab_window_west_lower") { w.a = [430, 630]; w.b = [430, 640]; }
    }

    // DOORS. `at` is where the opening is on room B's edge; `a`/`b` its ends. `via` is the room whose outline gets the one-tile tunnel, and `s` the way from B's edge to that room's edge.
    const DOORS = {
        door_chamber_teleport_1: { a: [205, 500], b: [245, 500], via: "crystal_chamber", s: [0, -1] },
        door_teleport_1_deck: { a: [230, 760], b: [270, 760], via: "observation_deck", s: [0, 1] },
        door_lobby_hallway_west: { a: [400, 410], b: [455, 410], via: "front_lobby", s: [0, -1] },
        door_lobby_hallway_east: { a: [750, 410], b: [790, 410], via: "front_lobby", s: [0, -1] },
        door_security_lobby: { a: [824, 295], b: [824, 335], via: "front_lobby", s: [-1, 0] },
        door_security_hallway: { a: [875, 410], b: [905, 410], via: "security_room", s: [0, -1] },
        door_showroom_hallway: { a: [950, 490], b: [950, 550] },
        door_arena_hallway: { a: [370, 760], b: [440, 760], via: "arena", s: [0, 1] },
        door_passage_teleport_1: { a: [310, 565], b: [310, 605], via: "teleport_room_1", s: [-1, 0] },
        door_lab_passage: { a: [430, 565], b: [430, 605], via: "lab_passage", s: [-1, 0] },
        door_arena_armory: { a: [340, 1110], b: [340, 1150], via: "armory", s: [-1, 0] },
        door_crystal_hallway: { a: [370, 430], b: [370, 470], via: "crystal_chamber", s: [-1, 0] },
        open_stair_mouth: { a: [870, 630], b: [870, 760] },
        door_stair_teleport_2: { a: [965, 680], b: [965, 720], via: "teleport_stair_room", s: [-1, 0] },
    };
    const eq = (p, q) => Math.abs(p[0] - q[0]) < 0.5 && Math.abs(p[1] - q[1]) < 0.5;
    const on = (p, q, r) => Math.abs((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])) < 0.5 && r[0] >= Math.min(p[0], q[0]) - 0.5 && r[0] <= Math.max(p[0], q[0]) + 0.5 && r[1] >= Math.min(p[1], q[1]) - 0.5 && r[1] <= Math.max(p[1], q[1]) + 0.5;
    function tunnel(room, a, b, s) {   // cut a one-tile tunnel into `room`'s outline: its edge is G away from the opening, in direction s
        const a2 = [a[0] + s[0] * G, a[1] + s[1] * G], b2 = [b[0] + s[0] * G, b[1] + s[1] * G], P = room.polygon, ek = edgeKinds(room);
        for (let i = 0; i < P.length; i++) {
            const p = P[i], q = P[(i + 1) % P.length];
            if (!on(p, q, a2) || !on(p, q, b2)) continue;
            const d = (x) => Math.hypot(x[0] - p[0], x[1] - p[1]), first = d(a2) <= d(b2) ? [a2, a, b, b2] : [b2, b, a, a2];
            const ins = []; if (!eq(first[0], p)) ins.push(first[0]); ins.push(first[1], first[2]); if (!eq(first[3], q)) ins.push(first[3]);
            const seq = [p].concat(ins, [q]); P.splice(i + 1, 0, ...ins);
            if (ek) { const kinds = []; for (let j = 0; j + 1 < seq.length; j++) kinds.push(on(p, q, seq[j]) && on(p, q, seq[j + 1]) ? ek[i] : "wall"); ek.splice(i, 1, ...kinds); }   // (the tunnel's two sides and its end are plain wall)
            return true;
        }
        return false;
    }
    for (const o of M.openings) {
        const D = DOORS[o.id]; if (!D) continue;
        o.a = D.a.slice(); o.b = D.b.slice();
        if (D.via) { const room = M.rooms.find(r => r.id === D.via); if (!tunnel(room, D.a, D.b, D.s)) M._growErrors = (M._growErrors || []).concat("no edge of " + D.via + " for " + o.id); }
    }

    // RAMPS: the two flights of steps cross the new tunnels; the curved stair moves with the stair room
    for (const r of M.ramps) {
        if (r.id === "r_arena_steps") r.zone = { rect: [360, 715, 450, 855], axis: "y", c0: 725, c1: 825, steps: 5 };
        else if (r.id === "r_deck_door_steps") r.zone = { rect: [215, 715, 285, 855], axis: "y", c0: 725, c1: 825, steps: 5 };
        else if (r.id === "r_teleport_stairs") { r.centre = mv(r.centre, [0, 1]); r.zone = Object.assign({}, r.zone, { rect: [870, 620, 945, 760] }); }
    }
})();
