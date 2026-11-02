// ─────────────────────────────────────────────────────────
//  THE DAMAGE SYSTEM (docs/COMBAT.md §7; docs/NEXT-UPDATE.md, build A)
// ─────────────────────────────────────────────────────────
// ASKED (the owner, 2026-11-02): six damage types, each race and each follower subclass weak to some (×1.3) and resisting some (×0.7); and of the followers' attacks:
// "every single one of their attacks is half special and half physical ... and it's skewed depending on how it's laid out. And special attack is basically elemental damage."
//
// A HIT has two parts (dmgApply, called by applyDamage, js/helpers.js, for a hit that says what it is):
//   PHYSICAL   of the attack's type (slashing, piercing, projectile, crushing, earthquake)
//   ELEMENTAL  in the attacker's element
// How a hit splits:
//   a follower's   its number × (½ ATK + ½ SP.ATK); an attack typed Elemental ¼ and ¾, its physical quarter untyped. Each attack's number is retuned
//                  (dmgNorm) so its class's average damage stays where it was when the attack read one stat.
//   an enemy's     all physical; half and half if the enemy has an element (the toxic brood, the Toxic Queen)
//   the player's and a turret's   all of its type (they have no SP.ATK); a weapon's element still sets the triangle on the whole hit, as before
// Then each part meets the target's row (dmgRow: a creature's race, a follower's subclass, a clone's race; the player, an egg, a turret none),
// and the elemental part the element triangle (js/elements.js getElementMultiplier; ice on core: that part does nothing). A word for each part that met
// a weakness or a resistance floats over the target (SLASHING WEAK!, FIRE RESIST).
//
// What a hit is, passed as applyDamage's 7th argument (the constants below, so no hit makes garbage):
//   a follower's attack   { which: "main" | "alt" | "special", stat: "atk" | "sp" }: the type comes from its form (DMG_FORM); `stat` is the stat its number reads
//   anyone else's         { type, element?, player? }
// A hit with none keeps the old rule: the triangle on the whole hit (a burn's tick, a pool's, a reflected hit, a card's echo, a set amount).

const DMG_TYPES = ["slashing", "piercing", "projectile", "crushing", "earthquake", "elemental"];
const DMG_LABEL = { slashing: "SLASHING", piercing: "PIERCING", projectile: "PROJECTILE", crushing: "CRUSHING", earthquake: "EARTHQUAKE", elemental: "ELEMENTAL" };
const DMG_WEAK = 1.3, DMG_RESIST = 0.7;
const DMG_PHYSICAL_W = 0.5, DMG_ELEMENTAL_W = 0.75;   // the elemental share of a follower's attack: half and half; an Elemental attack a quarter and three quarters
const DMG_LEAN_STEP = 0.1;                           // a form's lean: each step moves 10% between ATK and SP.ATK (docs/COMBAT.md §7.7)

// What each race is weak to and resists (docs/COMBAT.md §7.3); a boss uses its race's row
const DMG_RACE = {
    ant:      { weak: ["crushing", "earthquake"],               resist: ["elemental"] },
    beetle:   { weak: ["crushing", "earthquake", "piercing"],   resist: ["slashing", "projectile"] },
    scorpion: { weak: ["elemental"],                            resist: ["slashing", "piercing", "projectile"] },
    spider:   { weak: ["slashing", "piercing", "projectile"],   resist: ["elemental"] },
    mantis:   { weak: ["slashing", "piercing", "projectile"],   resist: ["crushing", "earthquake"] },
    moth:     { weak: ["elemental", "projectile"],              resist: ["crushing", "earthquake"] },
};
// What each follower subclass is weak to and resists (docs/COMBAT.md §7.8)
const DMG_SUBCLASS = {
    crustacean: { weak: ["crushing", "earthquake"],   resist: ["slashing", "piercing"] },
    mollusk:    { weak: ["slashing", "piercing"],     resist: ["crushing", "earthquake"] },
    elemental:  { weak: ["earthquake", "projectile"], resist: ["slashing", "elemental"] },
    drone:      { weak: ["crushing", "elemental"],    resist: ["piercing", "projectile"] },
    jelly:      { weak: ["slashing", "elemental"],    resist: ["crushing", "projectile"] },
};
// Each form's attacks (docs/COMBAT.md §7.4): its main attack (the plain hit and its element's physical move, or a Mage's shot) and its alternate (its signature
// move or a technician's ability). An element special is Elemental for everyone.
const DMG_FORM = {
    quillstone: { main: "piercing",   alt: "projectile" },
    maw:        { main: "slashing",   alt: "piercing" },
    staticorb:  { main: "crushing",   alt: "crushing" },
    jellyram:   { main: "crushing",   alt: "crushing" },
    seeper:     { main: "slashing",   alt: "earthquake" },
    mimic:      { main: "slashing",   alt: "earthquake" },
    thunderhead:{ main: "elemental",  alt: "elemental" },
    voidstar:   { main: "elemental",  alt: "elemental" },
    embercowl:  { main: "elemental",  alt: "elemental" },
    rimestar:   { main: "projectile", alt: "projectile" },
    hornshell:  { main: "projectile", alt: "projectile" },
    rotshard:   { main: "projectile", alt: "elemental" },
    hammerslug: { main: "crushing",   alt: "crushing" },
    gooproxy:   { main: "crushing",   alt: "crushing" },
    thermite:   { main: "piercing",   alt: "piercing" },
    blightspider:{ main: "piercing",  alt: "elemental" },
    hovershell: { main: "crushing",   alt: "earthquake" },
    igloo:      { main: "slashing",   alt: "elemental" },
};
// The ten retired forms copy the form that replaced each (docs/COMBAT.md §7.8): attack types, lean and row. PETAL BLAZE, BUNKER BLOOM's own move, is Elemental.
const DMG_RETIRED = { bloom: "quillstone", reaver: "thunderhead", serpent: "voidstar", warden: "jellyram", manta: "staticorb", prism: "staticorb", voltring: "staticorb", halo: "embercowl", caldera: "seeper", petal: "hornshell" };
const DMG_RETIRED_ALT = { bloom: "elemental" };
// An egg hits with its scythe legs; an egg Mage's shot is a shot.
const DMG_EGG = "slashing", DMG_EGG_SHOT = "projectile";
// The enemies' attacks (docs/COMBAT.md §7.8): each race's bite and its special; a clone (the Mutator's) bites with Piercing
const DMG_RACE_BITE = { ant: "slashing", beetle: "crushing", scorpion: "piercing", spider: "piercing", mantis: "slashing", moth: "crushing" };
const DMG_ABILITY = { "MANDIBLE FRENZY": "slashing", "CARAPACE SLAM": "earthquake", "VENOM LANCE": "piercing", "BLADE FLURRY": "slashing" };

// The hits, made once (an attack passes one of these; nothing is allocated per hit)
const DMG_HIT_MAIN = Object.freeze({ which: "main", stat: "atk" });          // a follower's plain hit, its element's physical move, a job's attack
const DMG_HIT_SHOT = Object.freeze({ which: "main", stat: "sp" });           // a Mage's shot
const DMG_HIT_ALT = Object.freeze({ which: "alt", stat: "atk" });            // a signature move, a technician's ability (they read ATK)
const DMG_HIT_SPECIAL = Object.freeze({ which: "special", stat: "sp" });     // an element special, a fire eruption
const DMG_HIT_SPECIAL_ATK = Object.freeze({ which: "special", stat: "atk" });// the fire forms' FIRE BOMBS move (it reads ATK)
const DMG_HIT_LAUNCH = Object.freeze({ which: "alt", stat: "atk", type: "earthquake" });   // a follower thrown by the Kinetic Launcher, landing
const DMG_HIT_GUN = Object.freeze({ type: "projectile", player: true });     // the player's guns, and the turrets
const DMG_HIT_LASH = Object.freeze({ type: "slashing", player: true });      // the Mutator's lash
const DMG_HIT_PUNCH = Object.freeze({ type: "crushing", player: true });     // the Technomancer's gauntlet
const DMG_HIT_ARC = Object.freeze({ type: "elemental", element: "electric", player: true });   // the Technomancer's arc
// the arc of a Technomancer's role (a Player card, js/playercards.js): the same hit in the role's element (rule 2: for the triangle), each made once
const _DMG_HIT_ARC_OF = {};
function dmgArcHit(el) { if (!el || el === "electric") return DMG_HIT_ARC; return _DMG_HIT_ARC_OF[el] || (_DMG_HIT_ARC_OF[el] = Object.freeze({ type: "elemental", element: el, player: true })); }
const DMG_HIT_CLONE = Object.freeze({ type: "piercing" });                   // the Mutator's clone's bite
// the clone's bite with a Mutator's role awake (a Player card, js/playercards.js playerCloneElement): Piercing still and all physical, the role's element setting the triangle on the whole hit as the player's
// own hits do (`player`; rule 2: for the triangle only), each made once
const _DMG_HIT_CLONE_OF = {};
function dmgCloneHit(el) { if (!el) return DMG_HIT_CLONE; return _DMG_HIT_CLONE_OF[el] || (_DMG_HIT_CLONE_OF[el] = Object.freeze({ type: "piercing", element: el, player: true })); }
const DMG_HIT_ELEMENTAL = Object.freeze({ type: "elemental" });              // an enemy's elemental extra (a charged shot); the element comes with the hit
const DMG_HIT_ENEMY = {};                                                    // an enemy's hit by its type: { slashing: {type}, ... }
for (const t of DMG_TYPES) DMG_HIT_ENEMY[t] = Object.freeze({ type: t });

// A creature's bite (its race's type), or the Mutator's clone's (Piercing; in the element of a Mutator's role while one is awake: js/playercards.js)
function dmgBiteHit(p) { return p && p.isClone ? dmgCloneHit(typeof playerCloneElement === "function" ? playerCloneElement(p) : null) : DMG_HIT_ENEMY[(p && DMG_RACE_BITE[p.speciesName]) || "slashing"]; }
// A creature's special (MANDIBLE FRENZY, CARAPACE SLAM, VENOM LANCE, BLADE FLURRY), else its bite's type (a clone's special is not a bite: no role's element)
function dmgAbilityHit(p) { const n = p && p.abilityDef && p.abilityDef.name; return n && DMG_ABILITY[n] ? DMG_HIT_ENEMY[DMG_ABILITY[n]] : p && p.isClone ? DMG_HIT_CLONE : dmgBiteHit(p); }

// ── LOOKUPS ───────────────────────────────────────────────
// The form that decides a follower's attacks, lean and row: its own, or the one that replaced a retired form; null for an egg
function dmgFormId(f) { const id = f && f.evolved; return id ? (DMG_RETIRED[id] || id) : null; }
// A follower's type for an attack: "main", "alt" or "special"
function dmgFormType(f, which) {
    if (which === "special") return "elemental";
    const id = dmgFormId(f);
    if (!id) return which === "main" && f && f.role === "sniper" ? DMG_EGG_SHOT : DMG_EGG;
    if (which === "alt" && f.evolved && DMG_RETIRED_ALT[f.evolved]) return DMG_RETIRED_ALT[f.evolved];
    const e = DMG_FORM[id]; return e ? (e[which] || e.main) : DMG_EGG;
}
// A follower's subclass (js/cards.js EQUIP_FORM_SUBCLASS, through its form or its replacement's)
function dmgSubclass(f) { const id = dmgFormId(f); return id && typeof EQUIP_FORM_SUBCLASS !== "undefined" ? (EQUIP_FORM_SUBCLASS[id] || null) : null; }
// The row a target is hit by: a creature's or a clone's race, a follower's subclass; none for the player, an egg, a turret or the Crystal
function dmgRow(t) {
    if (!t) return null;
    if (t.isFollower && !t.isClone) { const s = dmgSubclass(t); return s ? DMG_SUBCLASS[s] || null : null; }
    if (t.speciesName && DMG_RACE[t.speciesName]) return DMG_RACE[t.speciesName];
    return null;
}
function dmgRowMult(row, type) { return !row || !type ? 1 : row.weak.indexOf(type) >= 0 ? DMG_WEAK : row.resist.indexOf(type) >= 0 ? DMG_RESIST : 1; }
// A form's lean (docs/COMBAT.md §7.7): Elemental species +1, shelled (crustacean, mollusk) −1, a main attack typed Elemental +1 more; an egg none
function dmgLean(f) {
    const id = dmgFormId(f); if (!id) return 0;
    const s = typeof EQUIP_FORM_SUBCLASS !== "undefined" ? EQUIP_FORM_SUBCLASS[id] : null;
    let L = s === "elemental" ? 1 : (s === "crustacean" || s === "mollusk") ? -1 : 0;
    if (DMG_FORM[id] && DMG_FORM[id].main === "elemental") L += 1;
    return L;
}
// The retune (docs/COMBAT.md §7.6, item 6): an attack that read one stat now reads a blend; this keeps its class's average damage where it was.
// The class's average ATK and SP.ATK come from its personalities (js/species.js); an evolved follower's SP.ATK was not raised by evolving before, so an
// attack that read SP.ATK is kept at that level for an evolved one too. The form's lean (§7.7) is in the blend as well, so a lean moves damage between
// the two parts without moving the form's average damage (§7.7: "the retune evens it out").
let _dmgMeans = null;
function _dmgClassMeans(role) {
    if (!_dmgMeans) {
        _dmgMeans = {};
        if (typeof FOLLOWER_TYPES !== "undefined" && typeof PERSONALITIES !== "undefined" && typeof BASE_STATS !== "undefined")
            for (const r in FOLLOWER_TYPES) {
                const ps = FOLLOWER_TYPES[r].personalities || []; let a = 0, s = 0;
                for (const p of ps) { a += BASE_STATS.attack * PERSONALITIES[p].attack; s += BASE_STATS.specialAttack * PERSONALITIES[p].specialAttack; }
                _dmgMeans[r] = ps.length ? { a: a / ps.length, s: s / ps.length } : { a: 10, s: 10 };
            }
    }
    return _dmgMeans[role] || _dmgMeans.brawler || { a: 10, s: 10 };
}
function dmgNorm(f, stat, w) {
    const role = f && (f.role === "sniper" || f.role === "camper") ? f.role : "brawler", m = _dmgClassMeans(role);
    const L = dmgLean(f) * DMG_LEAN_STEP;
    const blend = (1 - w) * m.a * (1 - L) + w * m.s * (1 + L);
    const was = stat === "sp" ? (f && f.evolved && typeof EVOLVE_MULT === "number" ? m.s / EVOLVE_MULT : m.s) : m.a;
    return blend > 0 ? was / blend : 1;
}

// ── A HIT ─────────────────────────────────────────────────
// The amount after its two parts meet the target (called by applyDamage before defense; a set amount and a reflected hit never come here).
function dmgApply(target, amount, source, element, hit) {
    let phys, elem, ptype, el, player = false;
    if (source && source.isFollower && !source.isClone && hit.which) {
        ptype = hit.type || dmgFormType(source, hit.which);
        const w = ptype === "elemental" ? DMG_ELEMENTAL_W : DMG_PHYSICAL_W;
        const st = source.stats || {}, A = st.attack > 0 ? st.attack : 1, S = st.specialAttack > 0 ? st.specialAttack : 1;
        const k = amount / (hit.stat === "sp" ? S : A) * dmgNorm(source, hit.stat, w);
        phys = k * (1 - w) * A; elem = k * w * S;
        if (ptype === "elemental") ptype = null;   // an Elemental attack's physical quarter has no type
        el = element || source.element || null;
    } else {
        ptype = hit.type || null; player = !!hit.player;
        el = hit.element || element || (source && source.element) || null;
        let w = 0;
        if (ptype === "elemental") { w = 1; ptype = null; }
        else if (el && !player) w = 0.5;           // an enemy with an element: half and half
        phys = amount * (1 - w); elem = amount * w;
    }
    const row = dmgRow(target);
    const pm = dmgRowMult(row, ptype);
    let em = 1;
    if (elem > 0) { em = dmgRowMult(row, "elemental"); if (el && target.element && typeof getElementMultiplier === "function") em *= getElementMultiplier(el, target.element); }
    // a player's weapon with an element (the laser on a selected element, an elemental lash) still sets the triangle on the whole hit, as it did
    let whole = 1;
    if (player && phys > 0 && el && target.element && typeof getElementMultiplier === "function") whole = getElementMultiplier(el, target.element);
    // OPPORTUNITY (a Brawler's cards, js/cards.js equipOpportunity; docs/UNIVERSAL-AND-PLAYER-CARDS.md): each weakness the hit exploits adds the card's share to the whole hit, the openings adding up (the owner, 2026-11-02).
    // The four: the target's race weak to the hit's physical type, weak to Elemental (both parts count), an element match-up (the triangle's ×1.3), a stunned or sleeping target (not a glitched one). On ice against core the
    // elemental part is nothing, and the bonus falls on the physical part that lands.
    if (source && source.isFollower && !source.isClone && source.cards && typeof equipOpportunity === "function") {
        const op = equipOpportunity(source);
        if (op > 0) {
            let n = 0;
            if (phys > 0 && pm > 1) n++;
            if (elem > 0 && dmgRowMult(row, "elemental") > 1) n++;
            if (elem > 0 && el && target.element && typeof getElementMultiplier === "function" && getElementMultiplier(el, target.element) > 1) n++;
            if (target.stunned > 0 || target.asleep > 0) n++;
            if (n) whole *= 1 + op * n;
        }
    }
    _dmgWords(target, ptype, pm, elem > 0 ? el : null, em);
    return (phys * pm + elem * em) * whole;
}
// A word for each part that met a weakness or a resistance; one set a target every 12 frames, so a flurry does not stack them
function _dmgWords(t, ptype, pm, el, em) {
    if (typeof floatingTexts === "undefined" || (pm === 1 && (!el || em === 1))) return;
    const f = typeof frame !== "undefined" ? frame : 0;
    if (t._dmgWordAt !== undefined && f - t._dmgWordAt < 12 && f >= t._dmgWordAt) return;
    t._dmgWordAt = f;
    let n = 0;
    // BESIDE the creature, clear of its name plate (the owner, 2026-11-02): to its right at its body's height (dx, dy in pixels), each word starting a little past its side
    // (centred text: half its width, about 3.3 px a letter at 11 px, plus the gap), the physical part's word over the elemental part's; they drift up slowly (about 18 px
    // in their 40 frames), so they stay beside the body and never climb into the name plate
    const put = (text, good) => { floatingTexts.push({ world: true, x: t.x, y: t.y, dx: 28 + String(text).length * 3.3, dy: 10 + 13 * n, text, color: good ? "#ffcc00" : "#88aaff", size: 11, life: 40, vy: -0.015 }); n++; };
    if (ptype && pm !== 1) put(DMG_LABEL[ptype] + (pm > 1 ? " WEAK!" : " RESIST"), pm > 1);
    if (el && em !== 1) put(String(el).toUpperCase() + (em > 1 ? " WEAK!" : em === 0 ? " IMMUNE" : " RESIST"), em > 1);
}
