// ─────────────────────────────────────────────────────────
//  PREDATOR CLASS
// ─────────────────────────────────────────────────────────
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
        this.entryDelay=30; this.reactionDelay=0;
        this.floatOffset=0;
        this.isRetreating=false;
        this.walkCycle=0;
        this.dead=false;
        this.body = {
            head:    { size:0.45, widthScale:1, heightScale:1 },
            thorax:  { size:0.9,  widthScale:1, heightScale:1 },
            abdomen: { size:0.75, widthScale:1, heightScale:1, segments:1, taper:0.9 }
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
            if (data.stats.moveSpeed) this.moveSpeed=data.stats.moveSpeed;
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
        const retreatScore = (1-hr)*0.9;
        const huntScore    = 0.4+(1-Math.min(1,distCrystal/6))*0.2;
        return { attack:attackScore, retreat:retreatScore, hunt:huntScore, wander:0.1 };
    }

    update() {
        if (this.dead) return;

        // ── THREAT SCAN ──
        let threat=null, bestDist=Infinity;
        if (this.lastAttacker&&!this.lastAttacker.dead) {
            const dx=this.lastAttacker.x-this.x, dy=this.lastAttacker.y-this.y;
            const d=Math.sqrt(dx*dx+dy*dy);
            if (d<6) { threat=this.lastAttacker; bestDist=d; } // extended from 3→6 for ranged hit-back
        }
        if (!threat) {
            actors.forEach(a => {
                if (a.team==="green"&&!a.dead&&(!a.spawnProtection||a.spawnProtection<=0)) {
                    const dx=a.x-this.x, dy=a.y-this.y, d=Math.sqrt(dx*dx+dy*dy);
                    if (d<1.2&&d<bestDist) { bestDist=d; threat=a; }
                }
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
            if (utils[k]>bestScore+0.15) { bestState=k; bestScore=utils[k]; }
        }
        if (this.state!==bestState) {
            if (this.state==="attack") this.moveSpeed=(PREDATOR_TYPES[this.predatorType]||{moveSpeed:this.moveSpeed}).moveSpeed;
            this.state=bestState;
        }

        // ── CRAWL IN ──
        if (this.state==="crawl_in") {
            if (this.entryDelay>0) { this.entryDelay--; return; }
            const dy=this.entryTargetY-this.y;
            if (Math.abs(dy)>0.1) this.y+=dy*0.05;
            else this.state="hunt";
            return;
        }

        // ── WANDER ──
        if (this.state==="wander") {
            if (!this.wanderTarget||this.wanderTimer<=0) {
                const angle=Math.random()*Math.PI*2, radius=3+Math.random()*5;
                this.wanderTarget={ x:this.x+Math.cos(angle)*radius, y:this.y+Math.sin(angle)*radius };
                this.wanderTimer=90+Math.random()*120;
            }
            const dx=this.wanderTarget.x-this.x, dy=this.wanderTarget.y-this.y;
            const dist=Math.hypot(dx,dy);
            if (dist>0.001) {
                const tx=dx/dist, ty=dy/dist, ts=0.12;
                this.dirX+=(tx-this.dirX)*ts; this.dirY+=(ty-this.dirY)*ts;
                const len=Math.hypot(this.dirX,this.dirY)||1;
                this.dirX/=len; this.dirY/=len;
            }
            if (dist>0.2) { const sp=this.moveSpeed*0.7; this.x+=(dx/dist)*sp; this.y+=(dy/dist)*sp; }
            else this.wanderTimer=20+Math.random()*40;
            this.wanderTimer--;
        }

        // ── DAY: stay docile unless provoked ──
        if (gameState.phase === "day" && this.team !== "green") {
            if (this.state === "hunt" || this.state === "attack") {
                // Only revert to wander if not provoked
                if (!this.provoked) {
                    this.state = "wander";
                    this.moveSpeed = (PREDATOR_TYPES[this.predatorType] || this.def || {moveSpeed:0.02}).moveSpeed || 0.02;
                }
            }
        }

        // ── HUNT (→ crystal, with organic lateral weaving) ──
        if (this.state==="hunt") {
            const dx=crystal.x-this.x, dy=crystal.y-this.y;
            const dist=Math.sqrt(dx*dx+dy*dy);
            if (dist>0.8) {
                const crystalAngle = Math.atan2(dy, dx);
                // Wobble frequency varies per-predator via animationPhase and moveSpeed
                // so scouts dart faster/wider than tanks
                const wobbleFreq = 0.005 + this.moveSpeed * 0.25;
                const wobbleAmt  = Math.sin(this.animationPhase + frame * wobbleFreq) * 0.7;
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
                // ── ATTACK CRYSTAL ──
                if (!this.attackCooldown) this.attackCooldown=0;
                this.attackCooldown--;
                if (this.attackCooldown<=0) {
                    crystal.health=Math.max(0, crystal.health-this.power);
                    shake=6;
                    this.attackCooldown=60;
                }
                this.state="attack";
                this.currentTarget=null; // attacking crystal, not a unit
            }
        }

        // ── ATTACK UNIT ──
        else if (this.state==="attack") {
            const target=this.currentTarget;
            // if no unit target, hunt crystal
            if (!target||target.dead) {
                this.state="hunt"; this.currentTarget=null;
                this.moveSpeed=(PREDATOR_TYPES[this.predatorType]||{moveSpeed:this.moveSpeed}).moveSpeed;
                return;
            }
            this.moveSpeed=0;
            const dx=target.x-this.x, dy=target.y-this.y, dist=Math.sqrt(dx*dx+dy*dy);
            if (dist>1.5) {
                this.state="hunt"; this.currentTarget=null;
                this.moveSpeed=(PREDATOR_TYPES[this.predatorType]||{moveSpeed:this.moveSpeed}).moveSpeed;
                return;
            }
            this.attackAnim+=0.18;
            if (this.attackAnim>=Math.PI) this.attackAnim=0;
            if (!this.attackCooldown) this.attackCooldown=0;
            this.attackCooldown--;
            if (this.attackCooldown<=0) {
                applyDamage(target, this.power, this);
                this.attackCooldown=45;
            }
            return;
        }

        // ── RETREAT ──
        else if (this.state==="retreat") {
            if (this.health/this.maxHealth>0.75) { this.isRetreating=false; this.state="hunt"; return; }
            const pillar=findNearestFriendlyPillar({team:"red",x:this.x,y:this.y});
            if (pillar) {
                const dx=pillar.x-this.x, dy=pillar.y-this.y, dist=Math.sqrt(dx*dx+dy*dy)||0.001;
                this.dirX=dx/dist; this.dirY=dy/dist;
                if (dist>0.6) { this.x+=this.dirX*this.moveSpeed; this.y+=this.dirY*this.moveSpeed; }
                else this.health=Math.min(this.maxHealth,this.health+0.15);
            } else if (this.currentTarget&&!this.currentTarget.dead) {
                const dx=this.x-this.currentTarget.x, dy=this.y-this.currentTarget.y;
                const dist=Math.sqrt(dx*dx+dy*dy)||0.001;
                this.dirX=dx/dist; this.dirY=dy/dist;
                this.x+=this.dirX*this.moveSpeed; this.y+=this.dirY*this.moveSpeed;
            }
            // Keep legs moving during retreat
            this.walkCycle+=this.moveSpeed*40;
            return;
        }

        // ── HEAD CONTROL ──
        const bodyAngle=Math.atan2(this.dirY,this.dirX);
        // During retreat — head snaps to movement direction, no target locking
        const lookTarget = this.state==="retreat" ? null
                         : this.currentTarget && !this.currentTarget.dead ? this.currentTarget
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
            // No target (or retreating) — snap head to body/movement direction quickly
            const snapSpeed = this.state==="retreat" ? 0.35 : 0.15;
            let diff=bodyAngle-this.headAngle;
            if (diff>Math.PI) diff-=Math.PI*2;
            if (diff<-Math.PI) diff+=Math.PI*2;
            this.headAngle+=diff*snapSpeed;
            if (this.state!=="retreat") {
                this.headAngle+=Math.sin(frame*0.08)*0.01;
                let offset=this.headAngle-bodyAngle;
                if (offset>Math.PI) offset-=Math.PI*2;
                if (offset<-Math.PI) offset+=Math.PI*2;
                offset=Math.max(-1.05,Math.min(1.05,offset));
                this.headAngle=bodyAngle+offset;
            }
        }

        if (this.state==="hunt"||this.state==="wander") this.walkCycle+=this.moveSpeed*40;
        this.lastX=this.x; this.lastY=this.y;

        // ── ABDOMEN RANGED ATTACK ──
        if (this.abdomenAttack && !this.dead) {
            this.abdomenTimer++;
            if (this.abdomenTimer >= this.abdomenCooldown) {
                // Find the best target in the rear arc (>90° from facing)
                const bodyAngle = Math.atan2(this.dirY, this.dirX);
                let rearTarget = null, bestRearDist = Infinity;
                actors.forEach(a => {
                    if (a.dead || a.team !== "green") return;
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
                    const abX = this.x - this.dirX * 0.4;
                    const abY = this.y - this.dirY * 0.4;
                    const isCharged = this.charged && this.chargeElement;
                    const shotColor  = isCharged ? (this.chargeColor || "#ffcc00") : (this.color || "#88ff44");
                    const shotDamage = isCharged ? Math.round(this.rangeDamage * 1.8) : this.rangeDamage;
                    const shotRadius = isCharged ? 7 : 4;
                    const chargeElem = isCharged ? this.chargeElement : null;

                    spawnFollowerProjectile(
                        { x: abX, y: abY, stats: { specialAttack: shotDamage } },
                        rearTarget,
                        shotColor, shotDamage, shotRadius,
                        chargeElem ? (hit) => { if (hit) applyElementalDamage(hit, shotDamage * 0.5, this, chargeElem); } : null
                    );
                    // Tag projectile so it hits green team (predator shots target player's side)
                    if (followerProjectiles.length > 0) {
                        followerProjectiles[followerProjectiles.length - 1].targetsGreen = true;
                    }

                    if (isCharged) { this.charged = false; this.chargeElement = null; this.chargeColor = null; }
                    this.abdomenTimer = 0;
                }
            }
        }
    }
}
