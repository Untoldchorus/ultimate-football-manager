#!/usr/bin/env bash
set -euo pipefail

SCENE="goal_celebration"
CLUB="generic"
QUALITY="1080p"
ALL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --scene) SCENE="$2"; shift 2 ;;
    --club) CLUB="$2"; shift 2 ;;
    --quality) QUALITY="$2"; shift 2 ;;
    --all) ALL=true; shift ;;
    *) shift ;;
  esac
done

ALL_SCENES=(
  manager_intro stadium_entrance tunnel_walkout pre_match_talk
  goal_celebration half_time_talk red_card_reaction missed_penalty
  full_time player_signing trophy_presentation league_championship career_milestone
)

SCENES=("$SCENE")
if [ "$ALL" = true ]; then
  SCENES=("${ALL_SCENES[@]}")
fi

RES="1920x1080"
if [ "$QUALITY" = "4k" ]; then RES="3840x2160"; fi

for s in "${SCENES[@]}"; do
  OUT_DIR="public/cutscenes/$s"
  mkdir -p "$OUT_DIR"
  AVI="/tmp/ufm_${s}_${CLUB}.avi"
  godot --headless --path godot --write-movie "$AVI" --fixed-fps 30 --resolution "$RES" --script res://tools/render_cutscene.gd -- --scene="$s"
  ffmpeg -y -i "$AVI" -c:v libvpx-vp9 -b:v 6M -maxrate 8M -bufsize 12M -c:a libopus "$OUT_DIR/$CLUB.webm"
  ffmpeg -y -i "$AVI" -c:v libx264 -preset slow -crf 21 -maxrate 8M -bufsize 12M -movflags +faststart -c:a aac "$OUT_DIR/$CLUB.mp4"
  ffmpeg -y -i "$AVI" -ss 00:00:01 -vframes 1 -q:v 2 "$OUT_DIR/$CLUB.jpg"
done
