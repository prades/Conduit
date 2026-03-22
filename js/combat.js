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
        if (actor.slowed > 0) {
            actor.slowed--;
            if (actor.slowed <= 0) actor.slowFactor = 1;
        }

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
        if (canSpecial && (role==="hybrid" || Math.random() < 0.15)) {
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
