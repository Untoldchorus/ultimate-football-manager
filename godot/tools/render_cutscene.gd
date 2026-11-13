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

	# Spawn rigged 3D characters (manager & player) with skeletal animations
	var is_signing := scene_id in ["player_signing", "manager_intro", "pre_match_talk", "half_time_talk"]
	var char_path := "res://assets/characters/player.glb" if scene_id in ["player_signing", "goal_celebration", "red_card_reaction", "missed_penalty", "career_milestone"] else "res://assets/characters/manager.glb"
	if ResourceLoader.exists(char_path):
		var char_packed := ResourceLoader.load(char_path) as PackedScene
		var char_node := char_packed.instantiate()
		char_node.position = Vector3(0.0, 0.0, 0.0)
		char_node.scale = Vector3(1.15, 1.15, 1.15)
		stadium.add_child(char_node)
		var anim_player := char_node.find_child("AnimationPlayer", true, false) as AnimationPlayer
		if anim_player:
			var anims := anim_player.get_animation_list()
			var chosen := ""
			for preferred in (["walk", "Walk", "idle", "Idle"] if is_signing else ["run", "Run", "walk", "Walk", "idle", "Idle"]):
				if preferred in anims:
					chosen = preferred
					break
			if chosen == "" and anims.size() > 0:
				chosen = anims[0]
			if chosen != "":
				anim_player.play(chosen)

	var cam := Camera3D.new()
	cam.fov = 40.0
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
	var start_pos := Vector3(-2.8, 1.65, 3.8)
	var end_pos := Vector3(2.4, 1.55, 3.2)
	cam.position = start_pos
	cam.look_at(Vector3(0.0, 1.25, 0.0), Vector3.UP)

	var tween := create_tween()
	tween.tween_method(func(t: float) -> void:
		cam.position = start_pos.lerp(end_pos, t)
		cam.look_at(Vector3(0.0, 1.25, 0.0), Vector3.UP)
	, 0.0, 1.0, dur)
	tween.tween_callback(func() -> void: quit(0))
