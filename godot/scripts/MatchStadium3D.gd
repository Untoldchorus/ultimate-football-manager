extends Node3D
## Deterministic 3D Stadium & Articulated Match Viewer in Godot 4.
## Mirrors the exact coordinate system (0..100 pitch -> -50..50 X, -32..32 Z)
## and interpolation algorithm of `interpolateMatchStateAtClock` in Next.js.

var _pitch_root: Node3D
var _players_root: Node3D
var _ball_mesh: MeshInstance3D
var _camera: Camera3D

var _player_nodes: Dictionary = {} # playerId -> Node3D
var _events: Array = []
var _clock_seconds: float = 0.0
var _home_club_id: String = "home"
var _home_color: Color = Color("#10b981")
var _away_color: Color = Color("#f59e0b")
var _camera_preset: String = "broadcast"

func _ready() -> void:
	_build_environment()
	_build_stadium_and_pitch()
	_build_ball()
	_build_camera()

	WebBridge.timeline_updated.connect(_on_timeline_updated)
	WebBridge.clock_updated.connect(_on_clock_updated)
	WebBridge.camera_preset_changed.connect(_on_camera_preset_changed)

func _build_environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#020617")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("#38bdf8")
	env.ambient_light_energy = 0.45

	var world_env := WorldEnvironment.new()
	world_env.environment = env
	add_child(world_env)

	var sun := DirectionalLight3D.new()
	sun.position = Vector3(35.0, 65.0, 30.0)
	sun.look_at_from_position(sun.position, Vector3.ZERO, Vector3.UP)
	sun.light_energy = 1.35
	sun.shadow_enabled = true
	add_child(sun)

func _build_stadium_and_pitch() -> void:
	_pitch_root = Node3D.new()
	_pitch_root.name = "PitchRoot"
	add_child(_pitch_root)

	# 10 Alternating Turf Stripes (-45..45 X)
	for i in range(10):
		var stripe := MeshInstance3D.new()
		var plane := PlaneMesh.new()
		plane.size = Vector2(10.0, 68.0)
		stripe.mesh = plane
		var mat := StandardMaterial3D.new()
		mat.albedo_color = Color("#047857") if i % 2 == 0 else Color("#065f46")
		mat.roughness = 0.88
		stripe.material_override = mat
		stripe.position = Vector3(-45.0 + float(i) * 10.0, 0.0, 0.0)
		_pitch_root.add_child(stripe)

	# Touchlines, Goal Lines, and Halfway Line
	_add_pitch_line(Vector3(0, 0.02, -32), Vector2(100.0, 0.3))
	_add_pitch_line(Vector3(0, 0.02, 32), Vector2(100.0, 0.3))
	_add_pitch_line(Vector3(-50, 0.02, 0), Vector2(0.3, 64.0))
	_add_pitch_line(Vector3(50, 0.02, 0), Vector2(0.3, 64.0))
	_add_pitch_line(Vector3(0, 0.02, 0), Vector2(0.3, 64.0))

	# Goals (-50 and +50 X)
	_build_goal(-50.0)
	_build_goal(50.0)

	# Stadium Stands
	_build_stand(Vector3(0, 5.5, -42), Vector3(110, 11, 11))
	_build_stand(Vector3(0, 5.5, 42), Vector3(110, 11, 11))
	_build_stand(Vector3(-61, 5.5, 0), Vector3(11, 11, 76))
	_build_stand(Vector3(61, 5.5, 0), Vector3(11, 11, 76))

	_players_root = Node3D.new()
	_players_root.name = "PlayersRoot"
	add_child(_players_root)

func _add_pitch_line(pos: Vector3, sz: Vector2) -> void:
	var line := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = sz
	line.mesh = plane
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color.WHITE
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	line.material_override = mat
	line.position = pos
	_pitch_root.add_child(line)

func _build_goal(x_pos: float) -> void:
	var goal := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(2.3, 2.85, 7.4)
	goal.mesh = box
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(1, 1, 1, 0.35)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	goal.material_override = mat
	var dir := -1.0 if x_pos < 0.0 else 1.0
	goal.position = Vector3(x_pos + dir * 1.15, 1.45, 0.0)
	_pitch_root.add_child(goal)

func _build_stand(pos: Vector3, sz: Vector3) -> void:
	var stand := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = sz
	stand.mesh = box
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("#1e293b")
	stand.material_override = mat
	stand.position = pos
	_pitch_root.add_child(stand)

func _build_ball() -> void:
	_ball_mesh = MeshInstance3D.new()
	var sphere := SphereMesh.new()
	sphere.radius = 0.42
	sphere.height = 0.84
	_ball_mesh.mesh = sphere
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color.WHITE
	mat.emission_enabled = true
	mat.emission = Color("#fbbf24")
	mat.emission_energy_multiplier = 0.25
	_ball_mesh.material_override = mat
	_ball_mesh.position = Vector3(0.0, 0.42, 0.0)
	add_child(_ball_mesh)

func _build_camera() -> void:
	_camera = Camera3D.new()
	_camera.fov = 44.0
	add_child(_camera)
	_update_camera_transform(Vector3.ZERO)

func _update_camera_transform(ball_world: Vector3) -> void:
	if _camera == null:
		return
	var cam_pos := Vector3(0.0, 36.0, 56.0)
	var look_target := Vector3.ZERO
	if _camera_preset == "overhead":
		cam_pos = Vector3(0.0, 78.0, 0.1)
	elif _camera_preset == "followBall":
		cam_pos = Vector3(ball_world.x * 0.65, 20.0, ball_world.z + 26.0)
		look_target = ball_world
	elif _camera_preset == "goalReplay":
		var side := 64.0 if ball_world.x >= 0.0 else -64.0
		cam_pos = Vector3(side, 13.0, 18.0)
		look_target = ball_world
	_camera.look_at_from_position(cam_pos, look_target, Vector3.UP)

func _to_world_x(px: float) -> float:
	return (px - 50.0) * 1.0

func _to_world_z(py: float) -> float:
	return (py - 50.0) * 0.64

func _on_timeline_updated(events: Array, home_club_id: String, home_color: Color, away_color: Color) -> void:
	_events = events
	_home_club_id = home_club_id
	_home_color = home_color
	_away_color = away_color
	_interpolate_and_apply()

func _on_clock_updated(clock_seconds: float) -> void:
	_clock_seconds = clock_seconds
	_interpolate_and_apply()

func _on_camera_preset_changed(preset: String) -> void:
	_camera_preset = preset
	_interpolate_and_apply()

func _event_time_sec(ev: Dictionary) -> float:
	return (float(ev.get("minute", 1)) - 1.0) * 60.0 + float(ev.get("second", 0))

func _interpolate_and_apply() -> void:
	if _events.is_empty():
		return

	var prev_idx := 0
	for i in range(_events.size()):
		if _event_time_sec(_events[i]) <= _clock_seconds:
			prev_idx = i
		else:
			break

	var prev_ev: Dictionary = _events[prev_idx]
	var next_ev: Dictionary = _events[min(_events.size() - 1, prev_idx + 1)]

	var t0 := _event_time_sec(prev_ev)
	var t1 := _event_time_sec(next_ev)
	var alpha := clampf((_clock_seconds - t0) / (t1 - t0), 0.0, 1.0) if t1 > t0 else 0.0

	var b0: Dictionary = prev_ev.get("ballPosition", {"x": 50.0, "y": 50.0})
	var b1: Dictionary = next_ev.get("ballPosition", {"x": 50.0, "y": 50.0})
	var bx := lerpf(float(b0.get("x", 50.0)), float(b1.get("x", 50.0)), alpha)
	var by := lerpf(float(b0.get("y", 50.0)), float(b1.get("y", 50.0)), alpha)

	var ball_world := Vector3(_to_world_x(bx), 0.42, _to_world_z(by))
	_ball_mesh.position = ball_world
	_update_camera_transform(ball_world)

	var prev_players: Array = prev_ev.get("playerPositions", [])
	var next_players: Array = next_ev.get("playerPositions", [])
	var next_map: Dictionary = {}
	for np in next_players:
		next_map[str(np.get("playerId", ""))] = np

	for p in prev_players:
		var pid := str(p.get("playerId", ""))
		var np: Dictionary = next_map.get(pid, p)
		var px := lerpf(float(p.get("x", 50.0)), float(np.get("x", 50.0)), alpha)
		var py := lerpf(float(p.get("y", 50.0)), float(np.get("y", 50.0)), alpha)
		var team_id := str(p.get("teamId", ""))
		var p_node := _get_or_create_player_node(pid, team_id)
		p_node.position = Vector3(_to_world_x(px), 0.95, _to_world_z(py))

func _get_or_create_player_node(pid: String, team_id: String) -> MeshInstance3D:
	if _player_nodes.has(pid):
		return _player_nodes[pid]

	var mesh_inst := MeshInstance3D.new()
	var cap := CapsuleMesh.new()
	cap.radius = 0.28
	cap.height = 1.85
	mesh_inst.mesh = cap
	var mat := StandardMaterial3D.new()
	mat.albedo_color = _home_color if team_id == _home_club_id else _away_color
	mesh_inst.material_override = mat
	_players_root.add_child(mesh_inst)
	_player_nodes[pid] = mesh_inst
	return mesh_inst
