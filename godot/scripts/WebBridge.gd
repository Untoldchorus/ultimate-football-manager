extends Node
## Bidirectional bridge between Next.js (React) and the Godot 4 WebAssembly Match Viewer.
## Uses JavaScriptBridge when running on the Web platform to receive deterministic
## MatchEvent[] timelines, live clock ticks, camera preset changes, and quality settings.

signal timeline_updated(events: Array, home_club_id: String, home_color: Color, away_color: Color)
signal clock_updated(clock_seconds: float)
signal camera_preset_changed(preset: String)
signal quality_changed(quality: String)
signal match_speed_changed(speed: float)
signal cutscene_requested(cutscene_id: String, payload: Dictionary)
signal replay_requested(minute: int)

var events: Array = []
var current_clock_seconds: float = 0.0
var home_club_id: String = "home"
var home_color: Color = Color("#10b981")
var away_color: Color = Color("#f59e0b")
var camera_preset: String = "broadcast"
var quality_level: String = "medium"

# Keep JS callback references alive so they aren't garbage-collected
var _cb_load_timeline: JavaScriptObject
var _cb_set_clock: JavaScriptObject
var _cb_set_camera: JavaScriptObject
var _cb_set_quality: JavaScriptObject
var _cb_set_speed: JavaScriptObject
var _cb_play_cutscene: JavaScriptObject
var _cb_play_replay: JavaScriptObject

func _ready() -> void:
	if OS.has_feature("web"):
		_setup_javascript_bridge()

func _setup_javascript_bridge() -> void:
	var window := JavaScriptBridge.get_interface("window")
	if window == null:
		return

	_cb_load_timeline = JavaScriptBridge.create_callback(_on_js_load_timeline)
	_cb_set_clock = JavaScriptBridge.create_callback(_on_js_set_clock)
	_cb_set_camera = JavaScriptBridge.create_callback(_on_js_set_camera)
	_cb_set_quality = JavaScriptBridge.create_callback(_on_js_set_quality)
	_cb_set_speed = JavaScriptBridge.create_callback(_on_js_set_speed)
	_cb_play_cutscene = JavaScriptBridge.create_callback(_on_js_play_cutscene)
	_cb_play_replay = JavaScriptBridge.create_callback(_on_js_play_replay)

	# Expose functions on window.godotMatchBridge for Next.js React component
	JavaScriptBridge.eval("window.godotMatchBridge = window.godotMatchBridge || {};", true)
	var bridge := JavaScriptBridge.get_interface("godotMatchBridge")
	if bridge != null:
		bridge.loadTimeline = _cb_load_timeline
		bridge.setClock = _cb_set_clock
		bridge.setCamera = _cb_set_camera
		bridge.setQuality = _cb_set_quality
		bridge.setSpeed = _cb_set_speed
		bridge.playCutscene = _cb_play_cutscene
		bridge.playReplay = _cb_play_replay
		bridge.ready = true

	# Notify parent iframe / window that Godot is initialized and ready for timeline data
	JavaScriptBridge.eval("""
		if (window.parent && window.parent !== window) {
			window.parent.postMessage({ type: 'GODOT_VIEWER_READY' }, '*');
		}
	""", true)

func _on_js_load_timeline(args: Array) -> void:
	if args.size() == 0:
		return
	var json_str := str(args[0])
	var parsed = JSON.parse_string(json_str)
	if typeof(parsed) == TYPE_DICTIONARY:
		events = parsed.get("events", [])
		home_club_id = str(parsed.get("homeClubId", "home"))
		home_color = Color.from_string(str(parsed.get("homeColor", "#10b981")), Color("#10b981"))
		away_color = Color.from_string(str(parsed.get("awayColor", "#f59e0b")), Color("#f59e0b"))
		timeline_updated.emit(events, home_club_id, home_color, away_color)

func _on_js_set_clock(args: Array) -> void:
	if args.size() == 0:
		return
	current_clock_seconds = float(args[0])
	clock_updated.emit(current_clock_seconds)

func _on_js_set_camera(args: Array) -> void:
	if args.size() == 0:
		return
	camera_preset = str(args[0])
	camera_preset_changed.emit(camera_preset)

func _on_js_set_quality(args: Array) -> void:
	if args.size() == 0:
		return
	quality_level = str(args[0])
	quality_changed.emit(quality_level)

func _on_js_set_speed(args: Array) -> void:
	if args.size() == 0:
		return
	match_speed_changed.emit(float(args[0]))

func _on_js_play_cutscene(args: Array) -> void:
	if args.size() == 0:
		return
	var parsed = JSON.parse_string(str(args[0]))
	if typeof(parsed) == TYPE_DICTIONARY:
		cutscene_requested.emit(str(parsed.get("cutsceneId", "matchday_intro")), parsed)

func _on_js_play_replay(args: Array) -> void:
	if args.size() == 0:
		return
	replay_requested.emit(int(args[0]))

func emit_event_to_react(event_type: String, payload: Dictionary) -> void:
	if not OS.has_feature("web"):
		return
	var msg := JSON.stringify({
		"type": event_type,
		"payload": payload
	})
	JavaScriptBridge.eval("if (window.parent) window.parent.postMessage(%s, '*');" % msg, true)
