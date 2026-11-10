#!/bin/sh
# The CONDUIT key-art poster (2400 × 3600): bash design/key-art/make.sh [out.png]
# Renders every piece into design/key-art/out/ (not committed), then composes the poster. Needs node, playwright + chromium,
# and three.js 0.128 (fetched here into out/three with npm pack). See README.md.
set -e
D="$(cd "$(dirname "$0")" && pwd)"; O="$D/out"; mkdir -p "$O"
if [ ! -f "$O/three/package/build/three.min.js" ]; then mkdir -p "$O/three" && (cd "$O/three" && npm pack three@0.128.0 -q >/dev/null && tar xzf three-0.128.0.tgz); fi
export THREE_DIR="$O/three"
B="node $D/bake_hi.js $THREE_DIR"
# the followers, front-facing, large (the sky)
FACE=1 $B "$O/forms" thunderhead,voidstar,rotshard,embercowl,rimestar,hornshell,jellyram,maw,hovershell,igloo,gooproxy,mimic,coralcrab,sundew,shrub,hammerslug 1000
# the fight: turned right (left side) and left (right side), mid-attack
FACE=0 ACT=1 $B "$O/fightR" quillstone,staticorb,thermite,embercowl,seeper 800
FACE=2 ACT=1 $B "$O/fightL" electroskink,blightspider,maw,rotshard 800
# the heroes (the cube): facings 0, 1, 2 and 6 (6: from behind, aiming up at the mantis)
for f in 0 1 2 6; do FACE=$f $B "$O/hero/f$f" player_gun_aim,player_mech,player_laser_aim,player_coat 700; done
# the main character, large (top right)
FACE=0 $B "$O/main0" player_gun 1400
# the scene's own models
node "$D/r3d.js" "$D/mantis.js" "$O/mantis.png" 1400 1800
node "$D/r3d.js" "$D/hq.js" "$O/hq.png" 2000 1300
node "$D/r3d.js" "$D/plant.js" "$O/plant.png" 1600 1000
node "$D/poster.js" "${1:-$O/conduit-poster.png}"
