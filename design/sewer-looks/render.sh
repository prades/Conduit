#!/bin/bash
# SEWER LOOK DRAFTS (2026-11-15): every look's overview and close view at twice the pixels, then a labelled sheet of the overviews (ImageMagick's convert and montage).
#   bash design/sewer-looks/render.sh        (pictures in $OUT, default: the system's temp folder, sewer-looks)
cd "$(dirname "$0")"
export OUT="${OUT:-$(node -e "console.log(require('path').join(require('os').tmpdir(), 'sewer-looks'))")}"
mkdir -p "$OUT"
LOOKS="L0_today L1_facility L2_concrete L3_brick L4_pipeworks L5_tile L6_overgrown"
n=0; for L in $LOOKS; do node draft.js "$L.js" "${L%%_*}" 2 ob & n=$((n+1)); if [ $n -ge 4 ]; then wait -n; n=$((n-1)); fi; done; wait
command -v montage >/dev/null || { echo "pictures in $OUT (no ImageMagick: no sheet)"; exit 0; }
declare -A N=( [0]="0 · TODAY (for comparison)" [1]="1 · FACILITY, REFINED" [2]="2 · STORM DRAIN (CONCRETE)" [3]="3 · VICTORIAN BRICK" [4]="4 · PIPEWORKS" [5]="5 · TILED SERVICE TUNNEL" [6]="6 · OVERGROWN" )
for i in 0 1 2 3 4 5 6; do
  convert "$OUT/L${i}_o.png" -resize 50% -fill '#000000b0' -draw 'rectangle 0,0,600,50' -font DejaVu-Sans-Bold -pointsize 26 -fill white -annotate +16+35 "${N[$i]}" "$OUT/tile_$i.png"
  convert "$OUT/L${i}_b.png" -fill '#000000b0' -draw 'rectangle 0,0,1100,84' -font DejaVu-Sans-Bold -pointsize 46 -fill white -annotate +24+60 "${N[$i]}" -quality 88 "$OUT/close_$i.jpg"
done
convert -size 1180x820 xc:'#101314' -font DejaVu-Sans-Bold -pointsize 30 -fill '#e8e4d8' -annotate +40+80 'SEWER LOOKS · DRAFTS (2026-11-15)' \
  -font DejaVu-Sans -pointsize 23 -fill '#c9c4b6' -annotate +40+150 'Drawn on the game itself (the real Sewers, its props,' -annotate +40+184 'river and lighting). Nothing is in the game yet.' \
  -font DejaVu-Sans-Bold -pointsize 24 -fill '#e8e4d8' -annotate +40+260 'All six share the wall fix:' \
  -font DejaVu-Sans -pointsize 23 -fill '#c9c4b6' -annotate +40+300 '·  near walls cut clean: no saw-teeth' -annotate +40+336 '·  wall tops dark, so the north wall reads as one wall' -annotate +40+372 '·  a beam or arch over each side passage' -annotate +40+408 '·  one floor pattern, no random patches' \
  -font DejaVu-Sans-Bold -pointsize 24 -fill '#e8e4d8' -annotate +40+490 'What changes between them:' \
  -font DejaVu-Sans -pointsize 23 -fill '#c9c4b6' -annotate +40+530 'the material of the walls and the floor, the river edge,' -annotate +40+566 'the lamps and the wall detail (pipes, signs, growth).' -annotate +40+640 'Each look also has a close-up picture.' "$OUT/tile_legend.png"
montage "$OUT"/tile_0.png "$OUT"/tile_legend.png "$OUT"/tile_{1,2,3,4,5,6}.png -tile 2x4 -geometry 1180x820+6+6 -background '#060708' "$OUT/sheet.png"
convert "$OUT/sheet.png" -quality 86 "$OUT/sewer_looks_sheet.jpg"
echo "pictures in $OUT"
