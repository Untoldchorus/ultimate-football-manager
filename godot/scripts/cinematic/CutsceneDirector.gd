extends Node3D
## Reusable 3D Cinematic Cutscene Director
## Supports: manager_intro, player_signing, matchday_intro, goal_celebration,
## half_time, full_time, trophy_ceremony, career_milestone

signal cutscene_started(cutscene_id: String)
signal cutscene_finished(cutscene_id: String)

var active_cutscene_id: String = ""
var is_playing: bool = false
var is_paused: bool = false
var elapsed: float = 0.0
var duration: float = 6.0

@onready var cam: Camera3D = get_node_or_null("CutsceneCamera") as Camera3D

func play_cutscene(cutscene_id: String, payload: Dictionary = {}) -> void:
	active_cutscene_id = cutscene_id
	is_playing = true
	is_paused = false
	elapsed = 0.0
	duration = float(payload.get("duration", 6.0))
	cutscene_started.emit(cutscene_id)

func pause_cutscene() -> void:
	is_paused = true

func resume_cutscene() -> void:
	is_paused = false

func skip_cutscene() -> void:
	if not is_playing:
		return
	is_playing = false
	var finished_id := active_cutscene_id
	active_cutscene_id = ""
	cutscene_finished.emit(finished_id)
	if WebBridge != null:
		WebBridge.emit_event_to_react("CUTSCENE_COMPLETE", { "cutsceneId": finished_id })

func _process(delta: float) -> void:
	if not is_playing or is_paused:
		return

	elapsed += delta
	if cam != null:
		var t := elapsed / max(duration, 0.1)
		var orbit_angle := t * PI * 0.65
		cam.global_position = Vector3(sin(orbit_angle) * 14.0, 3.2 + sin(t * PI) * 2.0, cos(orbit_angle) * 14.0)
		cam.look_at(Vector3(0.0, 1.4, 0.0), Vector3.UP)

	if elapsed >= duration:
		skip_cutscene()
