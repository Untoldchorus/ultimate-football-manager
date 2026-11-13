extends Node3D
class_name CinematicCharacter
## Spawns a rigged GLB character, applies club kit colours, and manages smooth animation blending.

var model_node: Node3D = null
var anim_player: AnimationPlayer = null

func setup(glb_path: String, primary_color: Color, secondary_color: Color, char_scale: float = 1.15) -> void:
	if not ResourceLoader.exists(glb_path):
		push_warning("CinematicCharacter: GLB not found at " + glb_path)
		return
	var packed := ResourceLoader.load(glb_path) as PackedScene
	if packed == null:
		return
	model_node = packed.instantiate() as Node3D
	model_node.scale = Vector3(char_scale, char_scale, char_scale)
	add_child(model_node)
	anim_player = model_node.find_child("AnimationPlayer", true, false) as AnimationPlayer
	_apply_kit_tint(primary_color, secondary_color)

func _apply_kit_tint(primary: Color, _secondary: Color) -> void:
	if model_node == null:
		return
	for mesh in model_node.find_children("*", "MeshInstance3D", true, false):
		var mi := mesh as MeshInstance3D
		if mi != null and mi.get_surface_override_material_count() > 0:
			var mat := mi.get_active_material(0)
			if mat is StandardMaterial3D:
				var dup := mat.duplicate() as StandardMaterial3D
				dup.albedo_color = dup.albedo_color.lerp(primary, 0.35)
				mi.set_surface_override_material(0, dup)

func play_anim(candidates: Array[String], blend: float = 0.25) -> void:
	if anim_player == null:
		return
	var avail := anim_player.get_animation_list()
	for c in candidates:
		if c in avail:
			anim_player.play(c, blend)
			return
	if avail.size() > 0:
		anim_player.play(avail[0], blend)
