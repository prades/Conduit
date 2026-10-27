// ─────────────────────────────────────────────────────────
//  PREDATOR CLASS
// ─────────────────────────────────────────────────────────
// The creatures of the arena (js/facilityspawn.js makes them; js/species.js is what each species is). A creature potters about its room until something provokes it or an alarm is up; then it hunts
// (the Crystal, and whatever of yours it meets), bites what is in reach, and fires from its rear if its species does. A wounded creature does not fall back: there is nowhere for it to heal, so
// it stays in the fight, or in its wandering.
// The units within r tiles of column x — the column index (unitsNear, helpers.js) when it is loaded, every actor otherwise. Each creature scans its neighbourhood a few times a step.
function _predNear(x, r) { return typeof unitsNear === "function" ? unitsNear(x, r) : actors; }

class Predator {
    constructor(typeName, def, x, y) {
        this.type = "predator";
        this.predatorType = typeName;
        this.x=x; this.y=y;
        this.dirX=1; this.dirY=0;
        this.facing=0;
        this.lastX=x; this.lastY=y;
        this.attackCooldown=0; this.attackWindup=0;
        this.attackAnim=0; this.headAngle=Math.atan2(this.dirY, this.dirX);
        this.headTurnSpeed=0.05;
        this.hitFlash=0; this.hitStun=0;
        this.health=def.health; this.maxHealth=def.health;
        this.moveSpeed=def.moveSpeed; this.power=def.power;
        this.baseMoveSpeed=def.moveSpeed;   // stable reference for slow effects
        this.entryDelay=30; this.reactionDelay=0;
        this.floatOffset=0;
        this.walkCycle=0;
        this.dead=false;
        this.body = {
            head:    { size:0.45, widthScale:1, heightScale:1 },
            thorax:  { size:0.9,  widthScale:1, heightScale:1, yOffset:0 },
            abdomen: { size:0.75, widthScale:1, heightScale:1, segments:1, taper:0.9, angleOffset:0, yOffset:0 }
        };
        this.segmentOrder=["head","thorax","abdomen"];
        this.segmentSpacing=10;
        this.joints = {
            neck:    {forward:0, vertical:0},
            waist:   {forward:0, vertical:0},
            legRoot: {forward:0, vertical:0},
            wingRoot:{forward:0, vertical:0}
        };
        this.appendages = {
            legs:      { count:6, spread:10, swingSpeed:0.25, coxa:6, femur:9, tibia:11 },
            wings:     { enabled:true, length:14.2, width:10, angleOffset:6 },
            mandibles: { enabled:true, length:5, spread:0.4, thickness:2 },
            antennae:  { enabled:false, length:6, curvature:0.3 },
            eyes:      { count:2, size:2, glow:0 },
            // Spider-specific
            pedipalps:   { enabled:false, length:8, thickness:2 },
            chelicerae:  { enabled:false, length:10, fangCurve:0.6, thickness:3 },
            spinnerets:  { enabled:false, count:2, size:3 }
        };
        this.armor = { plates:0, ridge:false };
        this.visual = {
            topLight:0.25, bottomDark:0.35, rimLight:0.4,
            segmentGradient:0.6, eyeGlow:0, wingAlpha:0.35, metalness:0
        };
        this.dimensions = { width:def.width, height:def.height };
        this.state="hunt";
        this.moveCooldown=0;
        this.target=null;
        this.currentTarget=null;
        this.color=def.color;
        this.animationPhase=Math.random()*Math.PI*2;
        this.wanderTarget=null;
        this.wanderTimer=0;
        // Hit-reaction & ranged attack stats (copied from species def on spawn)
        this.reactionSpeed   = def.reactionSpeed   ?? 15;
        this.abdomenAttack   = def.abdomenAttack    ?? false;
        this.rangeDamage     = def.rangeDamage      ?? 0;
        this.abdomenCooldown = def.abdomenCooldown  ?? 90;
        this.abdomenTimer    = 0;
        // Runtime charge state — populated externally when predator is enhanced
        this.charged         = false;
        this.chargeElement   = null;
        this.chargeColor     = null;
        this.lastAttacker    = null;
        this.provoked        = false;
        this.team            = "red";
        this.isClone         = false;
    }

    // Called by applyDamage whenever this predator takes a hit.
    // Determines whether to turn and retaliate or — for abdomenAttack predators
    // hit from behind — stay oriented and keep their weapon aimed at the threat.
    onHit(source) {
        if (!source || this.dead) return;

        const dx = source.x - this.x;
        const dy = source.y - this.y;
        const toAttackerAngle = Math.atan2(dy, dx);
        const bodyAngle       = Math.atan2(this.dirY, this.dirX);
        let   diff            = toAttackerAngle - bodyAngle;
        if (diff >  Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        const fromBehind = Math.abs(diff) > Math.PI * 0.75; // >135° counts as "from behind"

        this.lastAttacker  = source;
        this.currentTarget = source;
        this.provoked      = true;

        if (this.abdomenAttack && fromBehind) {
            // Rear is the weapon — don't rotate; keep butt aimed at the attacker.
            // Accelerate next abdomen shot if the timer is already close.
            if (this.abdomenTimer > this.abdomenCooldown * 0.5) {
                this.abdomenTimer = Math.floor(this.abdomenCooldown * 0.5);
            }
            return;
        }

        // Normal reaction: turn toward attacker and enter attack state immediately
        this.state        = "attack";
        this.reactionDelay = this.reactionSpeed;
    }

    loadPreset(data) {
        if (!data) return;
        if (data.body) {
            Object.assign(this.body.head,    data.body.head    ||{});
            Object.assign(this.body.thorax,  data.body.thorax  ||{});
            Object.assign(this.body.abdomen, data.body.abdomen ||{});
            if (data.body.segmentSpacing) this.segmentSpacing=data.body.segmentSpacing;
        }
        if (data.dimensions)  Object.assign(this.dimensions, data.dimensions);
        if (data.appendages)  Object.keys(data.appendages).forEach(k => { if(this.appendages[k]) Object.assign(this.appendages[k],data.appendages[k]); });
        if (data.stats) {
            if (data.stats.moveSpeed) { this.moveSpeed=data.stats.moveSpeed; this.baseMoveSpeed=data.stats.moveSpeed; }
            if (data.stats.health)   { this.health=data.stats.health; this.maxHealth=data.stats.health; }
            if (data.stats.power)    this.power=data.stats.power;
        }
    }

    evaluateUtility() {
        const hr = this.health/this.maxHealth;
        const dxC=crystal.x-this.x, dyC=crystal.y-this.y;
        const distCrystal=Math.hypot(dxC,dyC);
        const attackScore = this.currentTarget&&!this.currentTarget.dead
            ? 1-Math.min(1,Math.hypot(this.currentTarget.x-this.x,this.currentTarget.y-this.y)/2) : 0;
        const huntScore    = 0.4+(1-Math.min(1,distCrystal/6))*0.2;
        return { attack:attackScore, hunt:huntScore, wander:0.1 };
    }

    // THE BITE (docs/COMBAT.md). Its target: the unit it turned on while it is still in reach, else the nearest of the other side in reach; with COMBAT.bite.splash, everyone in reach (the old rule).
    // Disoriented, it bites its own kind. In smoke it misses half the time. The Crystal is bitten the same way (target === crystal). Returns what it hit, or null.
    // Its reach is COMBAT.bite.reach, or its own (biteReach: a clone's, js/clone.js cloneReach).
    bite(target) {
        const B = COMBAT.bite, R = this.biteReach || B.reach, reach2 = R * R, pwr = this.power * (this.disorientPowerFactor || 1.0) * (this.toxicWeakened > 0 ? 0.6 : 1.0);
        if (target === crystal) { crystal.health = Math.max(0, crystal.health - pwr); shake = Math.max(shake, 6); return crystal; }
        const inReach = a => { const dx = a.x - this.x, dy = a.y - this.y; return dx * dx + dy * dy <= reach2; };
        if (this.disorientFF > 0) { let n = null; actors.forEach(a => { if (a === this || a.dead || a.team !== "red" || a.isClone || isNeutralBystander(a) || !inReach(a)) return; applyDamage(a, pwr, this); n = a; }); return n; }
        const hitTeam = this.isClone ? "red" : "green";
        if (!this.isClone && this.smokeDebuff > 0 && Math.random() < 0.5) { if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: this.x, y: this.y, text: "MISS", color: "#aabb88", life: 30, vy: -0.04 }); return null; }   // the smoke screen: half its bites miss
        if (B.splash) { let n = null; actors.forEach(a => { if (a.dead || a.team !== hitTeam || isNeutralBystander(a) || !inReach(a)) return; applyDamage(a, pwr, this); n = a; }); return n; }
        let t = target && !target.dead && target.team === hitTeam && !isNeutralBystander(target) && inReach(target) ? target : null;
        if (!t) { let bd = reach2; actors.forEach(a => { if (a.dead || a.team !== hitTeam || isNeutralBystander(a)) return; const dx = a.x - this.x, dy = a.y - this.y, d2 = dx * dx + dy * dy; if (d2 <= bd) { bd = d2; t = a; } }); }
        if (t) applyDamage(t, pwr, this);
        return t;
    }
    // The bite's two beats, once a target is in reach: the rest runs down, then it REARS BACK for COMBAT.bite.windup frames (attackWindup counts down; the telegraph is drawn over it, js/combat.js
    // drawBiteTelegraphs; the body rears: attackAnim goes negative), then the bite lands (bite()) and the body lunges (attackAnim runs 0 to π). A target that got out of reach in the wind-up is missed.
    _biteTick(target) {
        if (this.attackWindup > 0) {
            this.attackWindup--;
            this.attackAnim = -0.6 * (1 - this.attackWindup / COMBAT.bite.windup);
            if (this.attackWindup <= 0) { this.bite(this.biteTarget || target); this.attackAnim = 0.01; this.attackCooldown = COMBAT.bite.cooldown; this.biteTarget = null; }
            return;
        }
        if (this.attackAnim > 0) { this.attackAnim += 0.18; if (this.attackAnim >= Math.PI) this.attackAnim = 0; }   // the lunge after a landed bite
        if (!this.attackCooldown) this.attackCooldown = 0;
        this.attackCooldown--;
        if (this.attackCooldown <= 0) { this.attackWindup = COMBAT.bite.windup; this.biteTarget = target; }
    }

    update() {
        if (this.dead) return;

        // ── STATUS TIMERS ──
        if (this.smokeDebuff  > 0) this.smokeDebuff--;
        if (this.disorientFF  > 0) this.disorientFF--;

        // ── BLIND ──
        // It cannot see: no target, no attack, no shot — it staggers about at
        // half pace until it clears.
        if (this.blinded > 0) {
            this.blinded--;
            if (this.state === "attack") this.moveSpeed = (PREDATOR_TYPES[this.predatorType] || this.def || { moveSpeed: 0.02 }).moveSpeed || 0.02;
            this.currentTarget = null; this.state = "wander";
            if (!this._blindDir || frame % 30 === 0) { const a = Math.random() * Math.PI * 2; this._blindDir = { x: Math.cos(a), y: Math.sin(a) }; }
            this.x += this._blindDir.x * this.moveSpeed * 0.5;
            this.y += this._blindDir.y * this.moveSpeed * 0.5;
            return;
        }

        // ── THE PLAYER, UP CLOSE ──
        // Brush against one, or let it walk up to you, and it turns and bites:
        // one of your three hits, and you are knocked back a step (hurtPlayer).
        // It is the ONLY way a predator hurts you — no shots, no blasts.
        // The grace after a hit (PLAYER_HIT_GRACE) is what spaces the bites out.
        if (!this.isClone && !this.untargetable && typeof predatorMayHurtPlayer === "function" && predatorMayHurtPlayer() && typeof player !== "undefined") {
            const pdx = player.x - this.x, pdy = player.y - this.y, _br = typeof PLAYER_BITE_RANGE === "number" ? PLAYER_BITE_RANGE : 0.9;
            if (pdx * pdx + pdy * pdy <= _br * _br) {
                faceToward(this, player.x, player.y, 0.5);
                if (hurtPlayer(this.power, 4, this)) this.attackAnim = Math.PI / 2;
            }
        }

        // ── CHARGE-UP ABILITY ──
        // It can claim the whole frame: an insect in its windup is rooted
        // (that is what makes the telegraph fair), a leaping one is mid-flight.
        if (abilityTick(this)) return;

        // ── THREAT SCAN ──
        let threat=null, bestDist=Infinity;
        if (this.lastAttacker&&!this.lastAttacker.dead) {
            const dx=this.lastAttacker.x-this.x, dy=this.lastAttacker.y-this.y;
            const d=Math.sqrt(dx*dx+dy*dy);
            if (d<6) { threat=this.lastAttacker; bestDist=d; } // extended from 3→6 for ranged hit-back
        }
        if (!threat) {
            const scanTeam = this.isClone ? "red" : "green";
            // Only units within reach (1.2 tiles) can be a threat: the column
            // index, not every actor in the game, for every predator, every step.
            _predNear(this.x, 1.2).forEach(a => {
                if (a.team!==scanTeam||a.dead) return;
                if (isNeutralBystander(a)) return;   // not a threat, not a target
                if (!this.isClone && (a.spawnProtection||0)>0) return;
                const dx=a.x-this.x, dy=a.y-this.y, d=Math.sqrt(dx*dx+dy*dy);
                if (d<1.2&&d<bestDist) { bestDist=d; threat=a; }
            });
        }
        if (threat) {
            if (this.reactionDelay<=0) { this.state="attack"; this.currentTarget=threat; this.reactionDelay=this.reactionSpeed; }
            else this.reactionDelay--;
        }

        // ── HEAD LOOK ──
        // head tracking handled in HEAD CONTROL below
        if (!this.currentTarget || this.currentTarget.dead) this.headAngle+=Math.sin(frame*0.08)*0.02;

        // ── UTILITY AI ──
        const utils=this.evaluateUtility();
        let bestState=this.state, bestScore=utils[this.state]||0;
        for (const k in utils) {
            // A wanderer is never promoted to "hunt" by the utility AI: it stays ambient.
            if (this.isWanderer && k==="hunt") continue;
            // Nor is a calm creature (no alarm, not provoked): the CALM rule below put them back to wandering in the same frame, after the wander had been skipped, so they stood
            // exactly where they were spawned for good (the arena's creatures never moved).
            if (k==="hunt" && !alertActive && !this.provoked && this.team !== "green") continue;
            if (utils[k]>bestScore+0.15) { bestState=k; bestScore=utils[k]; }
        }
        if (this.state!==bestState) {
            if (this.state==="attack") this.moveSpeed=(PREDATOR_TYPES[this.predatorType]||{moveSpeed:this.moveSpeed}).moveSpeed;
            this.state=bestState;
        }
        // ── WANDER ──
        if (this.state==="wander") {
            if (!this.wanderTarget||this.wanderTimer<=0) {
                this.wanderTarget=facilityWanderTarget(this);   // a spot of its room (js/facilityspawn.js)
                this.wanderTimer=90+Math.random()*120;
            }
            let dx=this.wanderTarget.x-this.x, dy=this.wanderTarget.y-this.y;
            const distT=Math.hypot(dx,dy);   // (to the spot itself)
            // A spot the walls hide is walked to by the route (the next waypoint), not into the wall
            if (distT>0.3) { const w=facilitySteer(this, this.wanderTarget.x, this.wanderTarget.y); dx=w[0]-this.x; dy=w[1]-this.y; }
            const dist=Math.hypot(dx,dy);
            if (dist>0.001) {
                const tx=dx/dist, ty=dy/dist, ts=0.12;
                this.dirX+=(tx-this.dirX)*ts; this.dirY+=(ty-this.dirY)*ts;
                const len=Math.hypot(this.dirX,this.dirY)||1;
                this.dirX/=len; this.dirY/=len;
            }
            if (distT>0.2) { if (dist>0.001) { const sp=this.moveSpeed*0.7; this.x+=(dx/dist)*sp; this.y+=(dy/dist)*sp; } }
            else if (this.wanderTimer>60) this.wanderTimer=20+Math.random()*40;   // (arrived: a pause of 20 to 60 frames ONCE, then the next spot; set every frame it never ran out, and the creature stood at the first spot it reached for good)
            this.wanderTimer--;
        }

        // ── CALM (no alarm): graze unless provoked by a direct hit ──
        if (!alertActive && this.team !== "green") {
            if (this.state === "hunt" || this.state === "attack") {
                if (!this.provoked) {
                    this.state = "wander";
                    this.moveSpeed = (PREDATOR_TYPES[this.predatorType] || this.def || {moveSpeed:0.02}).moveSpeed || 0.02;
                }
            }
        }

        // ── HUNT (→ crystal, with organic lateral weaving) ──
        if (this.state==="hunt") {
            // ── CLONE HUNT: chase nearest red enemy ──
            if (this.isClone) {
                let nearestRed=null, bestRD=Infinity;
                actors.forEach(a => {
                    if (a.dead||a.team!=="red") return;
                    // A recruit on its way to the Crystal is not prey. Without
                    // this a clone still ACQUIRED one — it did no damage, but it
                    // chased the recruit instead of the enemy, and stood over
                    // it swinging.
                    if (isNeutralBystander(a)) return;
                    const d=Math.hypot(a.x-this.x, a.y-this.y);
                    if (d<bestRD) { bestRD=d; nearestRed=a; }
                });
                if (nearestRed) {
                    const dx=nearestRed.x-this.x, dy=nearestRed.y-this.y;
                    const dist=Math.hypot(dx,dy);
                    if (dist>1.0) {
                        this.dirX+=(dx/dist-this.dirX)*0.1;
                        this.dirY+=(dy/dist-this.dirY)*0.1;
                        const len=Math.hypot(this.dirX,this.dirY)||1;
                        this.dirX/=len; this.dirY/=len;
                        this.x+=this.dirX*this.moveSpeed;
                        this.y+=this.dirY*this.moveSpeed;
                    } else {
                        this.state="attack"; this.currentTarget=nearestRed;
                    }
                } else {
                    this.state="wander"; // no enemies left — patrol
                }
                this.walkCycle+=this.moveSpeed*40;
                this.lastX=this.x; this.lastY=this.y;
                return;
            }
            // ── DISORIENT: attack nearest red ally instead of crystal ──
            if (this.disorientFF > 0) {
                let nearRed=null, bd2=Infinity;
                actors.forEach(a=>{
                    if(a===this||a.dead||a.team!=="red"||a.isClone) return;
                    if(isNeutralBystander(a)) return;
                    const dx=a.x-this.x,dy=a.y-this.y,d2=dx*dx+dy*dy;
                    if(d2<bd2){bd2=d2;nearRed=a;}
                });
                if (nearRed) { this.currentTarget=nearRed; this.state="attack"; return; }
            }
            const dx=crystal.x-this.x, dy=crystal.y-this.y;
            const dist=Math.sqrt(dx*dx+dy*dy);
            if (dist>0.8) {
                // The facility has walls: it heads for the next waypoint of the route to the Crystal (js/facilityplay.js facilitySteer) and weaves only where it can see the Crystal (a weave
                // swung it into the wall it was walking along, and the reroute could not tell where it was going).
                const _fpW = facilitySteer(this, crystal.x, crystal.y);
                const crystalAngle = Math.atan2(_fpW[1]-this.y, _fpW[0]-this.x);
                // Wobble frequency varies per-predator via animationPhase and moveSpeed
                // so scouts dart faster/wider than tanks
                const wobbleFreq = 0.005 + this.moveSpeed * 0.25;
                const wobbleAmt  = Math.sin(this.animationPhase + frame * wobbleFreq) * (this._fpPath ? 0 : 0.3);
                const wobbleFade = Math.min(1, dist / 4); // reduce wobble when nearly at crystal
                const moveAngle  = crystalAngle + wobbleAmt * wobbleFade;
                // Smooth steering — avoids snapping, feels like a creature making decisions
                const desiredX = Math.cos(moveAngle), desiredY = Math.sin(moveAngle);
                this.dirX += (desiredX - this.dirX) * 0.07;
                this.dirY += (desiredY - this.dirY) * 0.07;
                const len = Math.hypot(this.dirX, this.dirY) || 1;
                this.dirX /= len; this.dirY /= len;
                this.x += this.dirX * this.moveSpeed;
                this.y += this.dirY * this.moveSpeed;
            } else {
                // ── ATTACK CRYSTAL ── the same two beats as a bite on a unit (a telegraph, then the bite)
                this._biteTick(crystal);
                // Face the Crystal while chewing on it, same as any other target.
                faceToward(this, crystal.x, crystal.y, 0.3);
                this.state="attack";
                this.currentTarget=null; // attacking crystal, not a unit
            }
        }

        // ── ATTACK UNIT ──
        else if (this.state==="attack") {
            const target=this.currentTarget;
            // if no unit target, hunt crystal
            if (!target||target.dead) {
                this.state="hunt"; this.currentTarget=null; this.attackWindup = 0; this.biteTarget = null;
                this.moveSpeed=(PREDATOR_TYPES[this.predatorType]||{moveSpeed:this.moveSpeed}).moveSpeed;
                return;
            }
            this.moveSpeed=0;
            const dx=target.x-this.x, dy=target.y-this.y, dist=Math.sqrt(dx*dx+dy*dy);
            if (dist>(this.biteReach || COMBAT.bite.reach)) {
                this.state="hunt"; this.currentTarget=null; this.attackWindup = 0; this.biteTarget = null;
                this.moveSpeed=(PREDATOR_TYPES[this.predatorType]||{moveSpeed:this.moveSpeed}).moveSpeed;
                return;
            }
            // Turn to face what we are biting. This branch returns before the
            // HEAD CONTROL block below ever runs, so this is the only chance.
            faceToward(this, target.x, target.y, 0.3);
            this._biteTick(target);   // the telegraph, then the bite (docs/COMBAT.md)
            return;
        }

        // ── HEAD CONTROL ──
        const bodyAngle=Math.atan2(this.dirY,this.dirX);
        const lookTarget = this.currentTarget && !this.currentTarget.dead ? this.currentTarget
                         : (crystal && this.state==="hunt" ? crystal : null);

        if (lookTarget) {
            // Track target — fast interpolation, no clamp so head freely faces prey
            const dx=lookTarget.x-this.x, dy=lookTarget.y-this.y;
            const targetAngle=Math.atan2(dy,dx);
            let diff=targetAngle-this.headAngle;
            if (diff>Math.PI) diff-=Math.PI*2;
            if (diff<-Math.PI) diff+=Math.PI*2;
            this.headAngle+=diff*0.22;
        } else {
            // No target — snap head to body/movement direction quickly
            let diff=bodyAngle-this.headAngle;
            if (diff>Math.PI) diff-=Math.PI*2;
            if (diff<-Math.PI) diff+=Math.PI*2;
            this.headAngle+=diff*0.15;
            this.headAngle+=Math.sin(frame*0.08)*0.01;
            let offset=this.headAngle-bodyAngle;
            if (offset>Math.PI) offset-=Math.PI*2;
            if (offset<-Math.PI) offset+=Math.PI*2;
            offset=Math.max(-1.05,Math.min(1.05,offset));
            this.headAngle=bodyAngle+offset;
        }

        if (this.state==="hunt"||this.state==="wander") this.walkCycle+=this.moveSpeed*40;

        // ── PREDATOR SEPARATION — push away from overlapping allies so they don't stack ──
        _predNear(this.x, 0.9).forEach(other => {
            if (other === this || !(other instanceof Predator) || other.dead) return;
            const sdx = this.x - other.x, sdy = this.y - other.y;
            const sd2 = sdx * sdx + sdy * sdy;
            const minDist = 0.9; // personal-space radius
            if (sd2 < minDist * minDist && sd2 > 0.0001) {
                const sd = Math.sqrt(sd2);
                const push = (minDist - sd) * 0.3;
                this.x += (sdx / sd) * push;
                this.y += (sdy / sd) * push;
            }
        });
        this.lastX=this.x; this.lastY=this.y;

        // ── ABDOMEN RANGED ATTACK ──
        if (this.abdomenAttack && !this.dead && (this.state !== "wander" || this.provoked)) this._abdomenTick();
    }

    // THE ABDOMEN SHOT (strikers and tanks of the species that have one): when its timer is up, a shot from its rear at whatever of the other side is behind it (or what last hit it), within 6 tiles.
    // A creature's hits your side; a clone's (js/clone.js cloneTick) hits the creatures, and never a recruit walking to the Crystal (team red until it gets there).
    _abdomenTick() {
        {
            this.abdomenTimer++;
            if (this.abdomenTimer >= this.abdomenCooldown) {
                // Find the best target in the rear arc (>90° from facing)
                const bodyAngle = Math.atan2(this.dirY, this.dirX);
                let rearTarget = null, bestRearDist = Infinity;
                const abdomenHitTeam = this.isClone ? "red" : "green";
                // Within 6 tiles only. (With nothing behind it the timer stays
                // full and this ran every step, over every actor.)
                _predNear(this.x, 6).forEach(a => {
                    if (a.dead || a.team !== abdomenHitTeam || isNeutralBystander(a) || a.untargetable) return;
                    const dx = a.x - this.x, dy = a.y - this.y;
                    const d  = Math.hypot(dx, dy);
                    let   diff = Math.atan2(dy, dx) - bodyAngle;
                    if (diff >  Math.PI) diff -= Math.PI * 2;
                    if (diff < -Math.PI) diff += Math.PI * 2;
                    if (Math.abs(diff) > Math.PI * 0.5 && d < 6 && d < bestRearDist) {
                        bestRearDist = d; rearTarget = a;
                    }
                });
                // Fall back to lastAttacker if they're not in rear arc but they just hit us
                if (!rearTarget && this.lastAttacker && !this.lastAttacker.dead) {
                    const d = Math.hypot(this.lastAttacker.x - this.x, this.lastAttacker.y - this.y);
                    if (d < 6) rearTarget = this.lastAttacker;
                }

                if (rearTarget) {
                    // The weapon is the abdomen, so aiming means turning the rear
                    // toward the target — otherwise the shot leaves sideways.
                    faceAbdomenToward(this, rearTarget.x, rearTarget.y, 0.35);
                    const abX = this.x - this.dirX * 0.4;
                    const abY = this.y - this.dirY * 0.4;
                    const isCharged = this.charged && this.chargeElement;
                    const shotColor  = isCharged ? (this.chargeColor || "#ffcc00") : (this.color || "#88ff44");
                    const shotDamage = isCharged ? Math.round(this.rangeDamage * 1.8) : this.rangeDamage;
                    const shotRadius = isCharged ? 7 : 4;
                    const chargeElem = isCharged ? this.chargeElement : null;
                    const isWebShot      = this.speciesName === "spider";
                    const isMantisAmbush = this.speciesName === "mantis";
                    const isMothDust     = this.speciesName === "moth";
                    // Mantis ambush — announce visually so the player can read the attack
                    if (isMantisAmbush) {
                        floatingTexts.push({ world:true, x:this.x, y:this.y, text:"AMBUSH!", color:"#44dd55", life:40, vy:-0.06 });
                    }
                    // Moth dust — announce wing-dust powder burst
                    if (isMothDust) {
                        floatingTexts.push({ world:true, x:this.x, y:this.y, text:"DUST!", color:"#dd8822", life:36, vy:-0.06 });
                    }

                    spawnFollowerProjectile(
                        { x: abX, y: abY, stats: { specialAttack: shotDamage } },
                        rearTarget,
                        isWebShot ? "#cceeaa" : shotColor, shotDamage, shotRadius,
                        (hit) => {
                            if (!hit) return;
                            // Web Shot — heavy slow (spider spinneret)
                            if (isWebShot) {
                                applySlow(hit, 300, 0.20);   // 5s at 20% speed — very heavy
                                floatingTexts.push({ world:true, x:hit.x, y:hit.y, text:"WEB!", color:"#cceeaa", life:35, vy:-0.05 });
                            }
                            if (chargeElem) applyElementalDamage(hit, shotDamage * 0.5, this, chargeElem);
                        }
                    );
                    // Tag projectile so it hits green team (predator shots target player's side); a clone's hits the creatures (untagged: isHostileTarget, js/game.js)
                    if (followerProjectiles.length > 0 && !this.isClone) {
                        followerProjectiles[followerProjectiles.length - 1].targetsGreen = true;
                    }

                    if (isCharged) { this.charged = false; this.chargeElement = null; this.chargeColor = null; }
                    this.abdomenTimer = 0;
                }
            }
        }
    }
}
