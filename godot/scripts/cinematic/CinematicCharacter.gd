extends Node3D
class_name CinematicCharacter
## Spawns a rigged GLB character, applies club kit colours, and manages smooth animation blending.

var model_node: Node3D = null
var anim_player: AnimationPlayer = null

func setup(glb_path: String, primary_color: Color, secondary_color: Color, char_scale: float = 1.15) -> void:
	var global_path := ProjectSettings.globalize_path(glb_path)
	if not FileAccess.file_exists(glb_path) and not FileAccess.file_exists(global_path):
		push_warning("CinematicCharacter: GLB not found at " + glb_path)
		return
	
	# Load runtime GLTF directly via globalize_path to bypass Godot import cache requirements
	var gltf := GLTFDocument.new()
	var state := GLTFState.new()
	var err := gltf.append_from_file(global_path, state)
	if err == OK:
		model_node = gltf.generate_scene(state)
	else:
		# Fallback to ResourceLoader
		if ResourceLoader.exists(glb_path):
			var packed := ResourceLoader.load(glb_path) as PackedScene
			if packed != null:
				model_node = packed.instantiate() as Node3D

	if model_node == null:
		push_warning("CinematicCharacter: Failed to instantiate GLTF scene from " + glb_path)
		return

	model_node.scale = Vector3(char_scale, char_scale, char_scale)
	add_child(model_node)
	anim_player = model_node.find_child("AnimationPlayer", true, false) as AnimationPlayer
	_apply_kit_tint(primary_color, secondary_color)

func _apply_kit_tint(primary: Color, secondary: Color) -> void:
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
					if mname in ["KitShirtMat", "SocksMat"]:
						var dup := mat.duplicate() as StandardMaterial3D
						dup.albedo_color = primary
						mi.set_surface_override_material(s, dup)
					elif mname == "KitSleeveMat":
						var dup2 := mat.duplicate() as StandardMaterial3D
						dup2.albedo_color = secondary
						mi.set_surface_override_material(s, dup2)

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
