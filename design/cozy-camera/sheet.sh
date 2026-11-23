#!/bin/bash
# THE COZY CAMERA: the side-by-side pictures and the contact sheet (design/cozy-camera/render.js's pictures; Proposed, drafts for the owner).
#   bash design/cozy-camera/sheet.sh <dir of the pictures>
# Writes <dir>/compare-<spot>.png (today | A | B | C, labelled, each at half size) and <dir>/start-here.png (every spot a row, smaller). Needs ImageMagick.
set -e
D="$1"; cd "$D"
LAB=("today" "A  low follow camera" "B  A + rolling world" "C  B + cozy feel")
SPOTS="chamber hallway arena sewers sewers2 chamber-t1 battle battle-ui"
NAMES=("Crystal Chamber, player and squad" "a hallway (Lab Hallway)" "the arena" "Sewers: the bridge grating" "Sewers: the walkway along the river" "Crystal Chamber, a quarter turn" "card battle (today: the battle camera as built; A-C: the new angle)" "card battle with the 2D layer and the cards shown")
i=0
for s in $SPOTS; do
  args=()
  for k in 0 1 2 3; do f=$(echo today A B C | cut -d' ' -f$((k+1)))-$s.png; [ -f "$f" ] || continue
    convert "$f" -resize 50% -gravity NorthWest -background '#111' -splice 0x44 -fill white -font DejaVu-Sans-Bold -pointsize 26 -annotate +14+8 "${LAB[$k]}" /tmp/cz_$k.png; args+=(/tmp/cz_$k.png); done
  convert "${args[@]}" +append -gravity NorthWest -background '#222' -splice 0x50 -fill '#ffd38a' -font DejaVu-Sans-Bold -pointsize 32 -annotate +14+8 "${NAMES[$i]}" compare-$s.png
  i=$((i+1))
done
convert $(for s in $SPOTS; do echo compare-$s.png; done) -append -resize 50% -gravity NorthWest -background "#111" -splice 0x70 -fill white -font DejaVu-Sans-Bold -pointsize 34 -annotate +16+14 "Cozy camera drafts, 2026-11-23 (proposed, not in the game): today | A | B | C" start-here.png
rm -f /tmp/cz_?.png
