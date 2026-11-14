extends "res://scripts/cinematic/CutsceneBase.gd"
class_name CinematicRig
## Reusable AAA multi-camera cinematic rig with DoF, stadium backdrop, rigged characters, and press flashes.

var _cam: Camera3D = null
var _flash_light: OmniLight3D = null
var _flash_timer: float = 0.0
var _enable_flashes: bool = false
var _actors: Array = []

const DURATIONS := {
	"manager_intro": 6.0,
	"stadium_entrance": 6.0,
	"tunnel_walkout": 6.0,
	"pre_match_talk": 5.0,
	"goal_celebration": 4.5,
	"half_time_talk": 5.0,
	"red_card_reaction": 4.5,
	"missed_penalty": 4.5,
	"full_time": 6.0,
	"player_signing": 5.5,
	"trophy_presentation": 6.0,
	"league_championship": 7.0,
	"career_milestone": 5.0,
}

func configure(new_params: Dictionary) -> void:
	cutscene_id = str(new_params.get("cutsceneId", cutscene_id))
	default_duration = float(DURATIONS.get(cutscene_id, 5.5))
	super.configure(new_params)
	_build_scene(new_params)

func _build_scene(p: Dictionary) -> void:
	var stadium_path := "res://scenes/MatchStadium3D.tscn"
	var world_env: WorldEnvironment = null
	if ResourceLoader.exists(stadium_path):
		var stadium := (ResourceLoader.load(stadium_path) as PackedScene).instantiate()
		add_child(stadium)
		world_env = stadium.find_child("WorldEnvironment", true, false) as WorldEnvironment

	var primary := Color.from_string(str(p.get("primaryColor", "#dc2626")), Color("#dc2626"))
	var secondary := Color.from_string(str(p.get("secondaryColor", "#ffffff")), Color("#ffffff"))

	_cam = Camera3D.new()
	_cam.fov = 38.0
	_cam.current = true
	add_child(_cam)

	var quality := str(p.get("quality", "high"))
	var QualityManager = load("res://scripts/cinematic/CinematicQualityManager.gd")
	QualityManager.apply_to_viewport(get_viewport(), world_env, _cam, quality)

	var is_player_hero := cutscene_id in ["player_signing", "goal_celebration", "red_card_reaction", "missed_penalty", "career_milestone", "trophy_presentation"]
	_enable_flashes = cutscene_id in ["player_signing", "manager_intro", "trophy_presentation", "league_championship"]

	if _enable_flashes:
		_flash_light = OmniLight3D.new()
		_flash_light.light_color = Color(0.95, 0.97, 1.0)
		_flash_light.light_energy = 0.0
		_flash_light.omni_range = 14.0
		_flash_light.position = Vector3(1.8, 1.9, 2.8)
		add_child(_flash_light)

		# Build 3D Pitchside Presentation Carpet & Club Unveiling Backdrop Arch
		var carpet := MeshInstance3D.new()
		var c_box := BoxMesh.new()
		c_box.size = Vector3(4.6, 0.04, 5.2)
		carpet.mesh = c_box
		var c_mat := StandardMaterial3D.new()
		c_mat.albedo_color = Color("#0f172a")
		carpet.material_override = c_mat
		carpet.position = Vector3(0.0, 0.02, -1.2)
		add_child(carpet)

		var backdrop := MeshInstance3D.new()
		var b_box := BoxMesh.new()
		b_box.size = Vector3(4.2, 2.3, 0.18)
		backdrop.mesh = b_box
		var b_mat := StandardMaterial3D.new()
		b_mat.albedo_color = primary.darkened(0.25)
		b_mat.roughness = 0.35
		backdrop.material_override = b_mat
		backdrop.position = Vector3(0.0, 1.15, -3.8)
		add_child(backdrop)

		var gold_trim := MeshInstance3D.new()
		var g_box := BoxMesh.new()
		g_box.size = Vector3(4.3, 0.12, 0.22)
		gold_trim.mesh = g_box
		var g_mat := StandardMaterial3D.new()
		g_mat.albedo_color = Color("#fbbf24")
		g_mat.metallic = 0.8
		g_mat.roughness = 0.2
		gold_trim.material_override = g_mat
		gold_trim.position = Vector3(0.0, 2.32, -3.8)
		add_child(gold_trim)

	var CharClass = load("res://scripts/cinematic/CinematicCharacter.gd")
	var hero = CharClass.new()
	add_child(hero)
	
	# Prefer newly generated realistic anatomical model with custom shirt presentation animation
	var glb := "res://assets/characters/footballer_unveiling.glb"
	if not FileAccess.file_exists(glb):
		glb = "res://assets/characters/player.glb" if is_player_hero else "res://assets/characters/manager.glb"
		
	hero.setup(glb, primary, secondary, 1.05)
	hero.position = Vector3(0.0, 0.0, -2.2) if cutscene_id in ["player_signing", "manager_intro"] else Vector3(0.0, 0.0, 0.0)
	_actors.append(hero)

	var dur := float(p.get("duration", default_duration))
	if cutscene_id in ["player_signing", "manager_intro"]:
		_run_player_unveiling(hero, dur)
	else:
		_run_standard_cinematic(hero, is_player_hero, dur)

func _run_player_unveiling(hero: Node, dur: float) -> void:
	hero.play_anim(["shirt_presentation", "walk", "Walk", "idle", "Idle"], 0.2)
	var walk_tween := create_tween()
	walk_tween.tween_property(hero, "position", Vector3(0.0, 0.0, 0.0), dur * 0.45).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)

	# Multi-shot broadcast coverage:
	# Shot 1 (0 to 45%): Low wide tracking shot capturing walk-in to presentation area
	# Shot 2 (45% to 75%): Medium heroic shot as player raises and holds up club jersey
	# Shot 3 (75% to 100%): Tight dramatic close-up showing jersey details, name, and press flash photography
	_cam.position = Vector3(-4.2, 1.9, 5.0)
	_cam.look_at_from_position(_cam.position, Vector3(0.0, 1.2, -1.0), Vector3.UP)

	var cam_tween := create_tween()
	cam_tween.tween_method(func(t: float) -> void:
		_cam.position = Vector3(-4.2, 1.9, 5.0).lerp(Vector3(2.4, 1.55, 3.2), t)
		_cam.look_at(hero.position + Vector3(0.0, 1.25, 0.0), Vector3.UP)
	, 0.0, 1.0, dur * 0.45)
	
	cam_tween.tween_method(func(t: float) -> void:
		_cam.position = Vector3(1.6, 1.45, 2.5).lerp(Vector3(-1.1, 1.48, 2.2), t)
		_cam.look_at(Vector3(0.0, 1.35, 0.0), Vector3.UP)
	, 0.0, 1.0, dur * 0.30)
	
	cam_tween.tween_method(func(t: float) -> void:
		_cam.position = Vector3(-0.45, 1.42, 1.65).lerp(Vector3(0.40, 1.46, 1.55), t)
		_cam.look_at(Vector3(0.0, 1.38, 0.0), Vector3.UP)
	, 0.0, 1.0, dur * 0.25)

func _run_standard_cinematic(hero: Node, is_player_hero: bool, dur: float) -> void:
	if is_player_hero:
		hero.play_anim(["run", "Run", "walk", "Walk", "idle", "Idle"], 0.25)
	else:
		hero.play_anim(["walk", "Walk", "idle", "Idle"], 0.25)

	var start_pos := Vector3(-3.2, 1.75, 4.0)
	var end_pos := Vector3(2.6, 1.55, 3.2)
	_cam.position = start_pos
	_cam.look_at(Vector3(0.0, 1.25, 0.0), Vector3.UP)

	var cam_tween := create_tween()
	cam_tween.tween_method(func(t: float) -> void:
		_cam.position = start_pos.lerp(end_pos, t)
		_cam.look_at(Vector3(0.0, 1.25, 0.0), Vector3.UP)
	, 0.0, 1.0, dur)

func _process(delta: float) -> void:
	super._process(delta)
	if _enable_flashes and _flash_light != null and is_running and not is_paused:
		_flash_timer -= delta
		if _flash_timer <= 0.0:
			_flash_light.light_energy = randf_range(0.18, 0.45) if randf() > 0.45 else 0.0
			_flash_timer = randf_range(0.08, 0.22)
		else:
			_flash_light.light_energy = max(0.0, _flash_light.light_energy - delta * 6.0)
