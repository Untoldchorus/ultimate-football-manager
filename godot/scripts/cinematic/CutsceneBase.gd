extends Node3D
class_name CutsceneBase
## Shared base class for all 13 canonical cutscenes in res://cutscenes/<id>/

signal cue_triggered(cue_name: String, time_sec: float)
signal sequence_completed()

@export var cutscene_id: String = ""
@export var default_duration: float = 8.0

var params: Dictionary = {}
var elapsed: float = 0.0
var is_running: bool = false
var is_paused: bool = false
var _fired_cues: Dictionary = {}

@onready var camera_rig: PathFollow3D = get_node_or_null("CameraPath/CameraFollow") as PathFollow3D
@onready var camera: Camera3D = get_node_or_null("CameraPath/CameraFollow/Camera3D") as Camera3D
@onready var anim_player: AnimationPlayer = get_node_or_null("AnimationPlayer") as AnimationPlayer

func configure(new_params: Dictionary) -> void:
	params = new_params
	elapsed = 0.0
	_fired_cues.clear()
	_apply_club_colours()
	if camera != null:
		camera.current = true
	if anim_player != null and anim_player.has_animation("main"):
		anim_player.play("main")
	is_running = true
	is_paused = false

func _apply_club_colours() -> void:
	var primary := Color.from_string(str(params.get("primaryColor", "#10b981")), Color("#10b981"))
	var secondary := Color.from_string(str(params.get("secondaryColor", "#ffffff")), Color("#ffffff"))
	for node in get_tree().get_nodes_in_group("home_kit"):
		if node is MeshInstance3D and node.material_override is ShaderMaterial:
			var mat := node.material_override as ShaderMaterial
			mat.set_shader_parameter("primary_color", primary)
			mat.set_shader_parameter("secondary_color", secondary)

func pause_sequence() -> void:
	is_paused = true
	if anim_player != null:
		anim_player.pause()

func resume_sequence() -> void:
	is_paused = false
	if anim_player != null:
		anim_player.play()

func stop_and_cleanup() -> void:
	is_running = false
	if anim_player != null:
		anim_player.stop()
	queue_free()

func _process(delta: float) -> void:
	if not is_running or is_paused:
		return
	elapsed += delta
	var dur := float(params.get("duration", default_duration))
	if camera_rig != null:
		camera_rig.progress_ratio = clamp(elapsed / max(dur, 0.1), 0.0, 1.0)
	_check_timing_cues(dur)
	if elapsed >= dur:
		is_running = false
		sequence_completed.emit()

func _check_timing_cues(dur: float) -> void:
	if not _fired_cues.has("intro") and elapsed >= 0.2:
		_fired_cues["intro"] = true
		cue_triggered.emit("intro", elapsed)
	if not _fired_cues.has("climax") and elapsed >= dur * 0.45:
		_fired_cues["climax"] = true
		cue_triggered.emit("climax", elapsed)
	if not _fired_cues.has("outro") and elapsed >= dur * 0.85:
		_fired_cues["outro"] = true
		cue_triggered.emit("outro", elapsed)
