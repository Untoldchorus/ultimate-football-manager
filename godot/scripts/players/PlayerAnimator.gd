extends Node3D
## Reusable Football Player Animation State Machine
## States: idle, walk, jog, sprint, pass, shoot, tackle, gk_dive, celebrate, disappointed

enum AnimState {
	IDLE,
	WALK,
	JOG,
	SPRINT,
	PASS,
	SHOOT,
	TACKLE,
	GK_DIVE,
	CELEBRATE,
	DISAPPOINTED,
}

var current_state: AnimState = AnimState.IDLE
var anim_player: AnimationPlayer = null
var target_velocity: Vector3 = Vector3.ZERO

func _ready() -> void:
	anim_player = get_node_or_null("AnimationPlayer") as AnimationPlayer

func set_state(new_state: AnimState) -> void:
	if current_state == new_state:
		return
	current_state = new_state
	_play_state_animation()

func move_toward_target(target_pos: Vector3, speed: float, delta: float) -> void:
	var dir := target_pos - global_position
	dir.y = 0.0
	var dist := dir.length()
	if dist < 0.15:
		set_state(AnimState.IDLE)
		return

	var norm := dir.normalized()
	global_position += norm * min(speed * delta, dist)

	# Smoothly rotate player to face movement direction (never slide sideways)
	var target_yaw := atan2(norm.x, norm.z)
	rotation.y = lerp_angle(rotation.y, target_yaw, clamp(delta * 10.0, 0.0, 1.0))

	if speed > 6.5:
		set_state(AnimState.SPRINT)
	elif speed > 3.5:
		set_state(AnimState.JOG)
	else:
		set_state(AnimState.WALK)

func _play_state_animation() -> void:
	if anim_player == null:
		return
	var state_name := AnimState.keys()[current_state].to_lower()
	if anim_player.has_animation(state_name):
		anim_player.play(state_name, 0.18)
