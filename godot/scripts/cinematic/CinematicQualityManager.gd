extends Node
class_name CinematicQualityManager
## Configures Godot 4 rendering quality presets: Low, Medium, High, Ultra.

enum Preset { LOW, MEDIUM, HIGH, ULTRA }

static func parse_preset(name: String) -> Preset:
	match name.to_lower():
		"low": return Preset.LOW
		"medium": return Preset.MEDIUM
		"high": return Preset.HIGH
		"ultra": return Preset.ULTRA
		_: return Preset.HIGH

static func apply_to_viewport(viewport: Viewport, world_env: WorldEnvironment, cam: Camera3D, preset_name: String) -> void:
	var preset := parse_preset(preset_name)
	if viewport != null:
		match preset:
			Preset.LOW:
				viewport.scaling_3d_scale = 0.75
				viewport.msaa_3d = Viewport.MSAA_DISABLED
			Preset.MEDIUM:
				viewport.scaling_3d_scale = 0.85
				viewport.msaa_3d = Viewport.MSAA_2X
			Preset.HIGH:
				viewport.scaling_3d_scale = 1.0
				viewport.msaa_3d = Viewport.MSAA_4X
			Preset.ULTRA:
				viewport.scaling_3d_scale = 1.0
				viewport.msaa_3d = Viewport.MSAA_8X

	if world_env != null and world_env.environment != null:
		var env := world_env.environment
		env.tonemap_mode = Environment.TONE_MAPPER_ACES
		env.glow_enabled = preset >= Preset.MEDIUM
		env.ssao_enabled = preset >= Preset.HIGH
		env.ssr_enabled = preset >= Preset.ULTRA
		env.sdfgi_enabled = false # Kept off for Compatibility/WebGL2 parity

	if cam != null:
		var attrs := CameraAttributesPractical.new()
		attrs.dof_blur_far_enabled = preset >= Preset.MEDIUM
		attrs.dof_blur_far_distance = 18.0
		attrs.dof_blur_far_transition = 6.0
		attrs.dof_blur_amount = 0.12 if preset >= Preset.HIGH else 0.06
		cam.attributes = attrs
