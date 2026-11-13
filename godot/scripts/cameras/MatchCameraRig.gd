extends Node3D
## 7-Mode Football Match Camera Rig
## Supports: broadcast, tactical, follow_ball, player_focus, goalkeeper, cinematic, goal_replay

@export var camera_path: NodePath = NodePath("Camera3D")
@onready var cam: Camera3D = get_node_or_null(camera_path) as Camera3D

var current_mode: String = "broadcast"
var target_ball_pos: Vector3 = Vector3.ZERO
var focus_player_pos: Vector3 = Vector3.ZERO
var lerp_speed: float = 5.0

func set_camera_mode(mode: String) -> void:
	current_mode = mode

func update_targets(ball_pos: Vector3, player_pos: Vector3) -> void:
	target_ball_pos = ball_pos
	focus_player_pos = player_pos

func _process(delta: float) -> void:
	if cam == null:
		return

	var desired_pos := Vector3(0, 22, 34)
	var look_target := target_ball_pos

	match current_mode:
		"broadcast":
			desired_pos = Vector3(target_ball_pos.x * 0.55, 22.0, 34.0 + target_ball_pos.z * 0.25)
			look_target = target_ball_pos
		"tactical":
			desired_pos = Vector3(0.0, 48.0, 6.0)
			look_target = Vector3(0.0, 0.0, 0.0)
		"follow_ball":
			desired_pos = target_ball_pos + Vector3(0.0, 8.5, 14.0)
			look_target = target_ball_pos
		"player_focus":
			desired_pos = focus_player_pos + Vector3(4.5, 3.2, 7.5)
			look_target = focus_player_pos + Vector3(0, 1.2, 0)
		"goalkeeper":
			var gk_side := -52.0 if target_ball_pos.x < 0.0 else 52.0
			desired_pos = Vector3(gk_side * 1.15, 4.0, 0.0)
			look_target = Vector3(0.0, 1.0, 0.0)
		"cinematic":
			var t := Time.get_ticks_msec() * 0.00025
			desired_pos = Vector3(cos(t) * 38.0, 14.0, sin(t) * 28.0)
			look_target = target_ball_pos
		"goal_replay":
			desired_pos = target_ball_pos + Vector3(-8.0, 5.0, 9.0)
			look_target = target_ball_pos

	cam.global_position = cam.global_position.lerp(desired_pos, clamp(delta * lerp_speed, 0.0, 1.0))
	cam.look_at(look_target, Vector3.UP)
