extends SceneTree
## Headless Movie Maker entry point for Path A offline HD rendering:
## godot --headless --path godot --write-movie out.avi --fixed-fps 30 --script res://tools/render_cutscene.gd -- --scene=goal_celebration --params=params.json

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var scene_id := "goal_celebration"
	var params_path := ""
	for a in args:
		if a.begins_with("--scene="):
			scene_id = a.substr(8)
		elif a.begins_with("--params="):
			params_path = a.substr(9)

	var params: Dictionary = {}
	if params_path != "" and FileAccess.file_exists(params_path):
		var parsed = JSON.parse_string(FileAccess.get_file_as_string(params_path))
		if typeof(parsed) == TYPE_DICTIONARY:
			params = parsed

	var tscn_path := "res://cutscenes/%s/scene.tscn" % scene_id
	if ResourceLoader.exists(tscn_path):
		var packed := ResourceLoader.load(tscn_path) as PackedScene
		var instance: Node = packed.instantiate()
		root.add_child(instance)
		instance.sequence_completed.connect(func(): quit(0))
		instance.configure(params)
		return

	# Fallback: render procedural 3D camera flyover inside MatchStadium3D.tscn
	var stadium_path := "res://scenes/MatchStadium3D.tscn"
	if not ResourceLoader.exists(stadium_path):
		push_error("Neither cutscene nor stadium scene found: " + tscn_path)
		quit(1)
		return

	var stadium_packed := ResourceLoader.load(stadium_path) as PackedScene
	var stadium := stadium_packed.instantiate()
	root.add_child(stadium)

	var cam := Camera3D.new()
	cam.fov = 50.0
	cam.current = true
	stadium.add_child(cam)

	var durations := {
		"manager_intro": 6.0,
		"stadium_entrance": 6.0,
		"tunnel_walkout": 6.0,
		"pre_match_talk": 5.0,
		"goal_celebration": 4.5,
		"half_time_talk": 5.0,
		"red_card_reaction": 4.5,
		"missed_penalty": 4.5,
		"full_time": 6.0,
		"player_signing": 5.0,
		"trophy_presentation": 6.0,
		"league_championship": 7.0,
		"career_milestone": 5.0,
	}
	var dur: float = durations.get(scene_id, 5.0)
	var start_pos := Vector3(-42.0, 18.0, 36.0)
	var end_pos := Vector3(42.0, 12.0, -28.0)
	cam.position = start_pos
	cam.look_at(Vector3.ZERO, Vector3.UP)

	var tween := create_tween()
	tween.tween_method(func(t: float) -> void:
		cam.position = start_pos.lerp(end_pos, t)
		cam.look_at(Vector3(0.0, 2.0, 0.0), Vector3.UP)
	, 0.0, 1.0, dur)
	tween.tween_callback(func() -> void: quit(0))
