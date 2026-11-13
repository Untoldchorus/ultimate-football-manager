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

	# Fallback: render via AAA CinematicRig (Ultra quality, multi-camera, DoF, flashes, rigged characters)
	var rig_script := ResourceLoader.load("res://scripts/cinematic/CinematicRig.gd") as GDScript
	if rig_script == null:
		push_error("CinematicRig.gd not found")
		quit(1)
		return
	var rig: Node = rig_script.new()
	var merged := params.duplicate()
	merged["cutsceneId"] = scene_id
	merged["quality"] = merged.get("quality", "ultra")
	root.add_child(rig)
	rig.sequence_completed.connect(func(): quit(0))
	rig.configure(merged)
