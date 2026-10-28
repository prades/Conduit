// ─────────────────────────────────────────────────────────
//  COMBAT READABILITY (docs/COMBAT.md): the knobs, the hit's record, the bite's telegraph
// ─────────────────────────────────────────────────────────
// ASKED: "Combat must be more readable [...] Make it clear to the player which enemy is attacking, when an attack is about to land, when damage is dealt, how much damage was dealt, how much health remains,
// when a unit is defeated." The audit (docs/COMBAT.md §1) found no double hits and no bug: a bite landed every 45 frames with no warning, on every unit in reach, for up to 45% of a unit's health, so a
// squad melted in two seconds. These are the rules that make a fight legible; none of the numbers is final.
const COMBAT = {
    bite: { windup: 18, cooldown: 45, reach: 1.5, splash: false },   // a creature's bite REARS BACK for `windup` frames (the telegraph), lands on its target (or on everyone in reach with `splash`), then rests `cooldown`
    hitCap: 0.34,                                                    // the most of a follower's or clone's max health one hit may take (it was 0.45)
    numbers: { ally: true, heal: true },                             // damage numbers over your own units ("−n", red) and healing ("+n", green); an enemy's numbers were always there
    lagBar: 36,                                                      // a health bar keeps a pale segment of the health just lost, draining over this many frames
    defeatText: 90,                                                  // "DEFEATED" over a unit that falls, for this long (0: none)
    // WHOM A CREATURE GOES FOR (js/predator.js predatorPickPrey; ASKED: "make them target you if you are weak especially. They should target weak targets and the player has a health bar too. They should also
    // target you if you attack them."). Every `every` frames a creature looks at your followers, your clones and YOU. It goes for (in sight, but the one that hit it is known through walls):
    //   - the one that hit it last (or touched it), from up to `revenge` tiles: it turns on whoever attacks it, the player too
    //   - in a fight (an alarm up, or provoked): anything within `close` tiles (in its way), and anything WEAK within `sense` tiles: down to `weakAt` of its health or less (the player: of its three hits)
    //   - calm (no alarm, not provoked): only what is down to `calmWeakAt` or less within `notice` tiles (the player: one hit left), or what hits or touches it
    // Of those it takes the best by its score: `near` (1 beside it, 0 at `sense` tiles) + `weak` × the share of its health lost (the PLAYER's share of its hits lost counts `weakPlayer` times: a weak player
    // is the first choice) + `attacker` if it hit it last + `keep` if it is after it already (it does not flit between two). With none of those it does what it did: the Crystal in a fight, its round when calm.
    // It CHASES what it picked (by the route round the walls) until it is in reach and bites it in the bite's two beats, or until it is more than `leash` tiles off (then it lets it go, and calms down if no alarm
    // is up).
    prey: { every: 12, close: 2.5, sense: 6, weakAt: 0.5, notice: 3, calmWeakAt: 0.34, revenge: 12, leash: 13, near: 1, weak: 1.2, weakPlayer: 2, attacker: 1, keep: 0.35 },
};
// A hit landed: remember the health it was taken from, so the bar can show the hit's size as a pale segment (applyDamage calls it with the health before the hit).
function noteHit(t, before) {
    if (!t || !(t.maxHealth > 0)) return;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    if (t._lagHealth === undefined || f0 - (t._lagAt || -1e9) > COMBAT.lagBar) t._lagHealth = before;   // a new burst starts from the health it found; hits that follow close on each other share it
    t._lagAt = f0;
}
// The pale segment's upper edge, as a share of max health (0 when there is none). Pure: it changes nothing (a step with no picture must leave the game exactly as a drawn one would, tests/ghost.js).
function unitLagPct(a) {
    if (!a || a._lagHealth === undefined || !(a.maxHealth > 0)) return 0;
    const u = ((typeof frame !== "undefined" ? frame : 0) - (a._lagAt || 0)) / COMBAT.lagBar;
    if (u >= 1 || u < 0) return 0;
    const lag = a._lagHealth + (a.health - a._lagHealth) * u;
    return Math.max(0, Math.min(1, lag / a.maxHealth));
}
// Healing, in one place: the health goes up (never past the max) and a green "+n" says so over the unit. Returns what it gave.
function healUnit(t, amount, source) {
    if (!t || t.dead || !(amount > 0) || !(t.maxHealth > 0)) return 0;
    const before = t.health; t.health = Math.min(t.maxHealth, t.health + amount); const got = t.health - before;
    if (got >= 0.5 && COMBAT.numbers.heal && typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: t.x, y: t.y, text: "+" + Math.round(got), color: "#7dff9a", size: 13, life: 40, vy: -0.035 });
    return got;
}
// THE TELEGRAPH, over the scene: every creature rearing back to bite wears a ring that closes as the bite comes, a chevron on it pointing at the unit it is biting, and the word BITE.
function drawBiteTelegraphs() {
    if (typeof ctx === "undefined" || typeof actors === "undefined" || typeof Predator === "undefined") return;
    const W = canvas.width / 2, H = canvas.height / 2;
    const scr = (x, y) => [(x - player.visualX - (y - player.visualY)) * TILE_W + W, (x - player.visualX + (y - player.visualY)) * TILE_H + H + TILE_H - (typeof facilityLiftRel === "function" ? facilityLiftRel(x, y) : 0)];
    let drew = false;
    for (const a of actors) {
        if (!a || a.dead || !(a.attackWindup > 0) || !(a instanceof Predator)) continue;
        if (!drew) { drew = true; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineCap = "round"; ctx.lineJoin = "round"; }
        const k = Math.max(0, Math.min(1, 1 - a.attackWindup / COMBAT.bite.windup)), [sx, sy] = scr(a.x, a.y), y0 = sy - 146, col = a.team === "green" || a.isClone ? "#19e6c1" : "#ff4a3a";
        const t = a.biteTarget, tp = t && Number.isFinite(t.x) ? scr(t.x, t.y) : null, ang = tp ? Math.atan2(tp[1] - sy, tp[0] - sx) : Math.PI / 2, r = 13 + 9 * k;
        ctx.globalAlpha = 0.55 + 0.45 * k; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(sx, y0, r, 0, Math.PI * 2); ctx.stroke();                                  // the ring, over its plate
        ctx.globalAlpha = 0.2 + 0.45 * k; ctx.beginPath(); ctx.arc(sx, y0, r * k, 0, Math.PI * 2); ctx.fill();  // filling as the bite comes
        const cx = sx + Math.cos(ang) * (r + 10), cy = y0 + Math.sin(ang) * (r + 10);                          // the chevron on the ring, toward the target
        ctx.globalAlpha = 0.95; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * 9, cy + Math.sin(ang) * 9); ctx.lineTo(cx + Math.cos(ang + 2.4) * 8, cy + Math.sin(ang + 2.4) * 8); ctx.lineTo(cx + Math.cos(ang - 2.4) * 8, cy + Math.sin(ang - 2.4) * 8); ctx.closePath(); ctx.fill();
        if (typeof cachedText === "function") cachedText("BITE", "bold 10px monospace", col, sx, y0 - r - 6);
        if (tp && t !== crystal) {   // and over the unit it is biting: a mark that drops as the bite comes, so the one in danger is read at a glance
            const my = tp[1] - 150 + 16 * k; ctx.globalAlpha = 0.5 + 0.5 * k; ctx.beginPath(); ctx.moveTo(tp[0], my + 10); ctx.lineTo(tp[0] - 8, my - 4); ctx.lineTo(tp[0] + 8, my - 4); ctx.closePath(); ctx.fill();
            ctx.globalAlpha = 0.35 + 0.25 * k; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, y0 + r + 4); ctx.lineTo(tp[0], my + 14); ctx.stroke();   // a thread from the ring to the mark
        }
    }
    if (drew) ctx.restore();
}

// ─────────────────────────────────────────────────────────
//  STATUS EFFECT UPDATES (burn, freeze, slow, disorient etc)
// ─────────────────────────────────────────────────────────
function updateStatusEffects() {
    actors.forEach(actor => {
        if (actor.dead) return;

        // ── BURN ──
        if (actor.burning > 0) {
            actor.burning--;
            if (actor.burning % 20 === 0) {
                applyDamage(actor, actor.burnDamage || 0.5, null);
            }
        }

        // ── FREEZE (probabilistic defrost) ──
        if (actor.frozen) {
            actor.frozenEscapeChance = Math.min(0.95, (actor.frozenEscapeChance||0.01) + 0.003);
            if (Math.random() < actor.frozenEscapeChance) {
                actor.frozen = false;
                actor.frozenEscapeChance = 0;
            }
        }

        // ── SLOW ──
        // tickSlowSpeed is what actually makes a slow slow anything: it scales
        // moveSpeed from a captured base. Before it existed, slowFactor was
        // written in eight places and read nowhere, so ice, webs and tar traps
        // set a number that no movement code ever looked at.
        if (actor.slowed > 0) actor.slowed--;
        tickSlowSpeed(actor);

        // ── DISORIENT — scrambles movement direction ──
        if (actor.disoriented > 0) {
            actor.disoriented--;
            if (actor.disoriented % 15 === 0) {
                actor.disorientDX = (Math.random()-0.5) * 0.5;
                actor.disorientDY = (Math.random()-0.5) * 0.5;
            }
        }

        // ── DEFENSE SHRED ──
        if (actor.defenseShredded > 0) actor.defenseShredded--;

        // ── SMOKE FORM (toxic evasion) ──
        if (actor.smokeForm > 0) actor.smokeForm--;

        // ── DEFENSE BOOST (core) ──
        if (actor.defenseBoost > 0) actor.defenseBoost--;

        // ── INVULNERABLE (core special) ──
        if (actor.invulnerable > 0) actor.invulnerable--;

        // ── SHIELD ──
        if (actor.shielded && actor.shieldAmount <= 0) actor.shielded = false;

        // ── KNOCKBACK VELOCITY — decays each frame, gives smooth animated push ──
        if (actor.kbVX || actor.kbVY) {
            const _kx = actor.x, _ky = actor.y;
            actor.x += actor.kbVX || 0;
            actor.y += actor.kbVY || 0;
            actor.kbVX = (actor.kbVX || 0) * 0.72;
            actor.kbVY = (actor.kbVY || 0) * 0.72;
            if (Math.abs(actor.kbVX) < 0.001) actor.kbVX = 0;
            if (Math.abs(actor.kbVY) < 0.001) actor.kbVY = 0;
            // A push goes as far as the facility's walls let it (facilityConstrain puts a unit back where it was when a wall is in the way).
            if (typeof facilityConstrain === "function") facilityConstrain(actor, _kx, _ky);
            if (typeof techShieldKeep === "function") techShieldKeep(actor, _kx, _ky);   // (nor through a Photonic Shield, an enemy: js/techabilities.js)
        }

        // ── EMP GLOW (electric ultimate hit marker) ──
        if (actor.empGlow > 0) actor.empGlow--;

        // ── TOXIC WEAKENED (smoke bomb power debuff) ──
        if (actor.toxicWeakened > 0) actor.toxicWeakened--;

        // ── PHYSICAL ATTACK VISUAL TIMERS (follower) ──
        if (actor.fireOrbitTimer  > 0) actor.fireOrbitTimer--;
        if (actor.sparkSurround   > 0) { actor.sparkSurround--; if (actor.sparkSurround <= 0) actor._electricChainTargets = null; }
        if (actor.icicleAttack)        { if (--actor.icicleAttack.timer <= 0) actor.icicleAttack = null; }
        if (actor.fluxAura        > 0) actor.fluxAura--;
        if (actor.corePulse       > 0) actor.corePulse--;

        // ── WILL REGEN ──
        if (typeof actor.currentWill === "number" && actor.stats) {
            if (actor.currentWill < actor.stats.will) {
                actor.currentWill = Math.min(
                    actor.stats.will,
                    actor.currentWill + WILL_REGEN_RATE
                );
            }
        }

        // ── RESONANCE REGEN ──
        if (typeof actor.currentResonance === "number" && actor.stats) {
            if (actor.currentResonance < 100) {
                actor.currentResonance = Math.min(100, actor.currentResonance + 0.05);
            }
        }
    });
}

// Status effect guards are merged into the main applyDamage below

// ─────────────────────────────────────────────────────────
//  FOLLOWER COMBAT DRIVER
//  Called from role movement blocks when in attack range
// ─────────────────────────────────────────────────────────
function followerAttack(actor, target) {
    if (!actor || !target || target.dead) return;
    if (!actor.attackCooldown) actor.attackCooldown = 0;
    if (actor.attackCooldown > 0) { actor.attackCooldown--; return; }

    const element  = actor.element;
    const attacks  = element ? ELEMENT_ATTACKS[element] : null;
    const role     = actor.role || "brawler";
    const hasWill  = actor.currentWill >= WILL_COST_PHYSICAL;
    const canSpecial = actor.currentWill >= WILL_COST_SPECIAL;

    // ── SNIPER recharge behavior ──
    if (role === "sniper" && !hasWill) {
        // Stop attacking, regen handled in updateStatusEffects
        return;
    }

    // Decide attack tier
    let attackTier = "normal";
    if (attacks && hasWill) {
        // Hybrid can use special more freely
        if (canSpecial && attacks.special && (role==="hybrid" || Math.random() < 0.15)) {   // (core has no special: its Radiant Pulse went with the followers' shield)
            attackTier = "special";
        } else {
            attackTier = "physical";
        }
    }

    // Execute attack
    actor.state = "attack"; actor.attackAnim = 0;
    if (attackTier === "normal") {
        // Plain hit — no aura, no element
        const baseDmg = (actor.stats?.attack||5) * 0.25;
        applyElementalDamage(target, baseDmg, actor, actor.element||null);
        if (actor.perk) { const pk=PERKS[actor.perk]; if(pk&&pk.onDealDamage) pk.onDealDamage(actor,baseDmg); }
        actor.attackCooldown = 45;

    } else if (attackTier === "physical" && attacks.physical) {
        attacks.physical(actor, target);
        actor.currentWill = Math.max(0, actor.currentWill - WILL_COST_PHYSICAL);
        if (actor.perk) { const pk=PERKS[actor.perk]; if(pk&&pk.onDealDamage) pk.onDealDamage(actor, actor.stats?.attack||5); }
        actor.attackCooldown = 40;

    } else if (attackTier === "special" && attacks.special) {
        attacks.special(actor, target);
        actor.currentWill = Math.max(0, actor.currentWill - WILL_COST_SPECIAL);
        if (actor.perk) { const pk=PERKS[actor.perk]; if(pk&&pk.onDealDamage) pk.onDealDamage(actor, actor.stats?.specialAttack||5); }
        actor.attackCooldown = 70;
    }

    // Resonance builds from damage output
    if (actor.currentResonance < 100) {
        actor.currentResonance = Math.min(100, actor.currentResonance + 2);
    }
}
