extends Node3D
class_name CinematicCharacter
## Spawns a rigged GLB character, applies per-player parametric appearance (kit, skin, hair, height/build, number/nameplate), and manages smooth animation blending.

var model_node: Node3D = null
var anim_player: AnimationPlayer = null
var _chest_num_label: Label3D = null
var _back_num_label: Label3D = null
var _back_name_label: Label3D = null

func setup(
	glb_path: String,
	primary_color: Color,
	secondary_color: Color,
	char_scale: float = 1.05,
	skin_color: Color = Color(0.58, 0.38, 0.26),
	hair_color: Color = Color(0.05, 0.04, 0.03),
	build_scale: float = 1.0,
	shirt_number: int = 9,
	player_name: String = ""
) -> void:
	var global_path := ProjectSettings.globalize_path(glb_path)
	if not FileAccess.file_exists(glb_path) and not FileAccess.file_exists(global_path):
		push_warning("CinematicCharacter: GLB not found at " + glb_path)
		return
	
	# Prefer ResourceLoader in exported builds (.pck) and GLTFDocument on desktop
	if ResourceLoader.exists(glb_path):
		var packed := ResourceLoader.load(glb_path) as PackedScene
		if packed != null:
			model_node = packed.instantiate() as Node3D

	if model_node == null:
		var gltf := GLTFDocument.new()
		var state := GLTFState.new()
		var err := gltf.append_from_file(global_path, state)
		if err == OK:
			model_node = gltf.generate_scene(state)

	if model_node == null:
		push_warning("CinematicCharacter: Failed to instantiate GLTF scene from " + glb_path)
		return

	model_node.scale = Vector3(char_scale * build_scale, char_scale, char_scale * build_scale)
	add_child(model_node)
	anim_player = model_node.find_child("AnimationPlayer", true, false) as AnimationPlayer
	_apply_appearance(primary_color, secondary_color, skin_color, hair_color)
	_attach_kit_labels(shirt_number, player_name, secondary_color)

func _apply_appearance(primary: Color, secondary: Color, skin: Color, hair: Color) -> void:
	if model_node == null:
		return
	for mesh in model_node.find_children("*", "MeshInstance3D", true, false):
		var mi := mesh as MeshInstance3D
		if mi != null and mi.mesh != null:
			var surf_count := mi.mesh.get_surface_count()
			for s in range(surf_count):
				var mat := mi.get_active_material(s)
				if mat is StandardMaterial3D:
					var mname := mat.resource_name
					if mname in ["KitShirtMat", "SocksMat"] or s in [1, 4]:
						var dup := mat.duplicate() as StandardMaterial3D
						dup.albedo_color = primary
						mi.set_surface_override_material(s, dup)
					elif mname == "KitSleeveMat" or s == 2:
						var dup2 := mat.duplicate() as StandardMaterial3D
						dup2.albedo_color = secondary
						mi.set_surface_override_material(s, dup2)
					elif mname == "SkinMat" or s == 0:
						var dup_skin := mat.duplicate() as StandardMaterial3D
						dup_skin.albedo_color = skin
						mi.set_surface_override_material(s, dup_skin)
					elif mname == "HairMat" or s == 3:
						var dup_hair := mat.duplicate() as StandardMaterial3D
						dup_hair.albedo_color = hair
						mi.set_surface_override_material(s, dup_hair)

func _attach_kit_labels(shirt_number: int, player_name: String, text_color: Color) -> void:
	if model_node == null or shirt_number <= 0:
		return
	var num_str := str(shirt_number)
	var surname := player_name.split(" ")[-1].to_upper() if player_name.strip_edges() != "" else "SIGNING"

	# Front chest squad number
	_chest_num_label = Label3D.new()
	_chest_num_label.text = num_str
	_chest_num_label.font_size = 42
	_chest_num_label.pixel_size = 0.0022
	_chest_num_label.modulate = text_color
	_chest_num_label.outline_size = 8
	_chest_num_label.outline_modulate = Color(0.05, 0.07, 0.12, 0.9)
	_chest_num_label.position = Vector3(0.0, 1.31, 0.185)
	model_node.add_child(_chest_num_label)

	# Back jersey number & surname
	_back_num_label = Label3D.new()
	_back_num_label.text = num_str
	_back_num_label.font_size = 76
	_back_num_label.pixel_size = 0.0028
	_back_num_label.modulate = text_color
	_back_num_label.outline_size = 10
	_back_num_label.outline_modulate = Color(0.05, 0.07, 0.12, 0.9)
	_back_num_label.position = Vector3(0.0, 1.28, -0.185)
	_back_num_label.rotation_degrees = Vector3(0, 180, 0)
	model_node.add_child(_back_num_label)

	_back_name_label = Label3D.new()
	_back_name_label.text = surname
	_back_name_label.font_size = 34
	_back_name_label.pixel_size = 0.0022
	_back_name_label.modulate = text_color
	_back_name_label.outline_size = 8
	_back_name_label.outline_modulate = Color(0.05, 0.07, 0.12, 0.9)
	_back_name_label.position = Vector3(0.0, 1.44, -0.185)
	_back_name_label.rotation_degrees = Vector3(0, 180, 0)
	model_node.add_child(_back_name_label)

func play_anim(candidates: Array, blend: float = 0.25) -> void:
	if anim_player == null:
		return
	var avail := anim_player.get_animation_list()
	for c in candidates:
		if c in avail:
			anim_player.play(c, blend)
			return
	if avail.size() > 0:
		anim_player.play(avail[0], blend)
