param(
  [string]$Scene = "goal_celebration",
  [string]$Club = "generic",
  [string]$Quality = "1080p",
  [switch]$All
)

$ErrorActionPreference = "Stop"
$AllScenes = @(
  "manager_intro", "stadium_entrance", "tunnel_walkout", "pre_match_talk",
  "goal_celebration", "half_time_talk", "red_card_reaction", "missed_penalty",
  "full_time", "player_signing", "trophy_presentation", "league_championship", "career_milestone"
)

$ScenesToRender = if ($All) { $AllScenes } else { @($Scene) }
$Res = if ($Quality -eq "4k") { "3840x2160" } else { "1920x1080" }

foreach ($s in $ScenesToRender) {
  $outDir = "public/cutscenes/$s"
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  $aviPath = "$env:TEMP/ufm_${s}_${Club}.avi"
  Write-Host "Rendering $s ($Club @ $Res) via Godot Movie Maker..."
  $godotBin = (Get-Command godot).Definition
  $p = Start-Process -FilePath $godotBin -ArgumentList "--path","godot","--write-movie",$aviPath,"--fixed-fps","30","--resolution",$Res,"--script","res://tools/render_cutscene.gd","--","--scene=$s" -Wait -PassThru
  if ($p.ExitCode -ne 0) { throw "Godot failed with exit code $($p.ExitCode)" }

  Write-Host "Encoding WebM (VP9), MP4 (H.264), and Poster JPG..."
  ffmpeg -y -i $aviPath -c:v libvpx-vp9 -b:v 6M -maxrate 8M -bufsize 12M -c:a libopus "$outDir/$Club.webm"
  ffmpeg -y -i $aviPath -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -preset slow -crf 21 -maxrate 8M -bufsize 12M -movflags +faststart -c:a aac "$outDir/$Club.mp4"
  ffmpeg -y -i $aviPath -ss 00:00:01 -vframes 1 -q:v 2 "$outDir/$Club.jpg"
}
