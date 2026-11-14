extends Node3D
## Deterministic 3D Stadium & Articulated Match Viewer in Godot 4.
## Mirrors the exact coordinate system (0..100 pitch -> -50..50 X, -32..32 Z)
## and interpolation algorithm of `interpolateMatchStateAtClock` in Next.js.

var _pitch_root: Node3D
var _players_root: Node3D
var _synergy_links_root: Node3D
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
	WebBridge.cutscene_requested.connect(_on_cutscene_requested)

func _build_environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#070b19")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("#e2e8f0")
	env.ambient_light_energy = 0.25
	env.tonemap_mode = Environment.TONE_MAPPER_ACES
	env.glow_enabled = true
	env.glow_intensity = 0.15

	var world_env := WorldEnvironment.new()
	world_env.name = "WorldEnvironment"
	world_env.environment = env
	add_child(world_env)

	var sun := DirectionalLight3D.new()
	sun.position = Vector3(25.0, 45.0, 35.0)
	sun.look_at_from_position(sun.position, Vector3.ZERO, Vector3.UP)
	sun.light_color = Color("#fffbeb")
	sun.light_energy = 0.55
	sun.shadow_enabled = true
	add_child(sun)

	var rim := DirectionalLight3D.new()
	rim.position = Vector3(-30.0, 28.0, -35.0)
	rim.look_at_from_position(rim.position, Vector3.ZERO, Vector3.UP)
	rim.light_color = Color("#bae6fd")
	rim.light_energy = 0.25
	add_child(rim)

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

	# Stadium Stands (brought closer to touchlines & tiered with crowd + roof + LED boards)
	_build_tiered_stand(Vector3(0, 0, -20.0), 104.0, false)
	_build_tiered_stand(Vector3(0, 0, 20.0), 104.0, true)
	_build_stand(Vector3(-56, 6.5, 0), Vector3(10, 13, 44))
	_build_stand(Vector3(56, 6.5, 0), Vector3(10, 13, 44))

	_players_root = Node3D.new()
	_players_root.name = "PlayersRoot"
	add_child(_players_root)

	_synergy_links_root = Node3D.new()
	_synergy_links_root.name = "SynergyLinksRoot"
	add_child(_synergy_links_root)

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

func _build_tiered_stand(base_pos: Vector3, length: float, flip_z: bool) -> void:
	var z_dir := 1.0 if flip_z else -1.0
	# 1. Pitchside LED Advertising Board
	var ad_board := MeshInstance3D.new()
	var ad_box := BoxMesh.new()
	ad_box.size = Vector3(length, 1.05, 0.35)
	ad_board.mesh = ad_box
	var ad_mat := StandardMaterial3D.new()
	ad_mat.albedo_color = Color("#0f172a")
	ad_mat.emission_enabled = true
	ad_mat.emission = Color("#dc2626")
	ad_mat.emission_energy_multiplier = 0.55
	ad_board.material_override = ad_mat
	ad_board.position = base_pos + Vector3(0, 0.52, -z_dir * 2.2)
	_pitch_root.add_child(ad_board)

	# 2. 6 Stepped Seating Tiers + Crowd Rows
	var crowd_colors := [Color("#dc2626"), Color("#f8fafc"), Color("#fbbf24"), Color("#1e293b"), Color("#ef4444")]
	for t in range(6):
		var tier := MeshInstance3D.new()
		var t_box := BoxMesh.new()
		t_box.size = Vector3(length, 1.8, 2.6)
		tier.mesh = t_box
		var t_mat := StandardMaterial3D.new()
		t_mat.albedo_color = Color("#1e293b") if t % 2 == 0 else Color("#0f172a")
		tier.material_override = t_mat
		var tz := base_pos.z + z_dir * (float(t) * 2.4)
		var ty := 0.9 + float(t) * 1.65
		tier.position = Vector3(base_pos.x, ty, tz)
		_pitch_root.add_child(tier)

		# Crowd band on top of tier
		var crowd := MeshInstance3D.new()
		var c_box := BoxMesh.new()
		c_box.size = Vector3(length * 0.96, 0.65, 1.1)
		crowd.mesh = c_box
		var c_mat := StandardMaterial3D.new()
		c_mat.albedo_color = crowd_colors[t % crowd_colors.size()]
		c_mat.roughness = 0.7
		crowd.material_override = c_mat
		crowd.position = Vector3(base_pos.x, ty + 1.15, tz - z_dir * 0.4)
		_pitch_root.add_child(crowd)

	# 3. Stadium Roof Canopy + Floodlight Strip
	var roof := MeshInstance3D.new()
	var r_box := BoxMesh.new()
	r_box.size = Vector3(length + 4.0, 0.7, 16.0)
	roof.mesh = r_box
	var r_mat := StandardMaterial3D.new()
	r_mat.albedo_color = Color("#334155")
	r_mat.metallic = 0.6
	roof.material_override = r_mat
	roof.position = Vector3(base_pos.x, 12.8, base_pos.z + z_dir * 6.0)
	_pitch_root.add_child(roof)

	var light_strip := MeshInstance3D.new()
	var l_box := BoxMesh.new()
	l_box.size = Vector3(length * 0.85, 0.25, 0.6)
	light_strip.mesh = l_box
	var l_mat := StandardMaterial3D.new()
	l_mat.albedo_color = Color.WHITE
	l_mat.emission_enabled = true
	l_mat.emission = Color("#fef08a")
	l_mat.emission_energy_multiplier = 2.5
	light_strip.material_override = l_mat
	light_strip.position = Vector3(base_pos.x, 12.35, base_pos.z - z_dir * 1.2)
	_pitch_root.add_child(light_strip)

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
	sphere.radius = 0.115
	sphere.height = 0.23
	_ball_mesh.mesh = sphere
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("#f8fafc")
	mat.roughness = 0.3
	mat.metallic = 0.1
	_ball_mesh.material_override = mat
	_ball_mesh.position = Vector3(0.42, 0.115, 0.48)
	add_child(_ball_mesh)

	# Add pro match-ball contrasting panel rings (black & crimson/gold)
	for rot_vec in [Vector3(0, 0, 0), Vector3(60, 45, 0), Vector3(-60, -45, 30)]:
		var ring := MeshInstance3D.new()
		var torus := CylinderMesh.new()
		torus.top_radius = 0.118
		torus.bottom_radius = 0.118
		torus.height = 0.035
		ring.mesh = torus
		var r_mat := StandardMaterial3D.new()
		r_mat.albedo_color = Color("#0f172a") if rot_vec.x == 0 else Color("#dc2626")
		r_mat.roughness = 0.35
		ring.material_override = r_mat
		ring.rotation_degrees = rot_vec
		_ball_mesh.add_child(ring)

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

var _active_cutscene_rig: Node = null

func _on_cutscene_requested(cutscene_id: String, payload: Dictionary) -> void:
	if _active_cutscene_rig != null and is_instance_valid(_active_cutscene_rig):
		_active_cutscene_rig.queue_free()
		_active_cutscene_rig = null

	var RigClass = load("res://scripts/cinematic/CinematicRig.gd")
	if RigClass == null:
		return
	var rig: Node = RigClass.new()
	_active_cutscene_rig = rig
	add_child(rig)
	var params: Dictionary = payload.get("params", payload) if typeof(payload.get("params")) == TYPE_DICTIONARY else payload.duplicate()
	params["cutsceneId"] = cutscene_id
	if payload.has("quality"):
		params["quality"] = payload.get("quality")
	rig.sequence_completed.connect(func():
		WebBridge.emit_event_to_react("CUTSCENE_COMPLETE", {"cutsceneId": cutscene_id})
	)
	rig.configure(params)

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

	_update_tactical_chemistry_synergy_links(prev_players)

func _update_tactical_chemistry_synergy_links(players: Array) -> void:
	if _synergy_links_root == null:
		return
	for child in _synergy_links_root.get_children():
		child.queue_free()

	# Render dynamic 3D Chemistry & Synergy tactical coordination links between nearby home teammates
	var home_positions: Array[Vector3] = []
	for p in players:
		if str(p.get("teamId", "")) == _home_club_id:
			var pid := str(p.get("playerId", ""))
			if _player_nodes.has(pid):
				home_positions.append(_player_nodes[pid].position)

	var max_links := 8
	var links_drawn := 0
	for i in range(home_positions.size()):
		if links_drawn >= max_links:
			break
		for j in range(i + 1, home_positions.size()):
			var pos_a: Vector3 = home_positions[i]
			var pos_b: Vector3 = home_positions[j]
			var dist := pos_a.distance_to(pos_b)
			if dist > 4.0 and dist < 21.0:
				var beam := MeshInstance3D.new()
				var box := BoxMesh.new()
				box.size = Vector3(0.12, 0.04, dist)
				beam.mesh = box
				var mat := StandardMaterial3D.new()
				mat.albedo_color = Color(0.06, 0.72, 0.5, 0.42) if dist < 14.0 else Color(0.22, 0.74, 0.97, 0.35)
				mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
				mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
				beam.material_override = mat
				var mid := (pos_a + pos_b) * 0.5
				mid.y = 0.08
				beam.look_at_from_position(mid, Vector3(pos_b.x, 0.08, pos_b.z), Vector3.UP)
				_synergy_links_root.add_child(beam)
				links_drawn += 1
				if links_drawn >= max_links:
					break

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
