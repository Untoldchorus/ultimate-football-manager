extends Node
## CutsceneDirector (Autoload)
## State machine: idle, loading, playing, paused, finished
## Supports queue for chained scenes, timing cues, skip, pause, resume, and memory cleanup.

enum State { IDLE, LOADING, PLAYING, PAUSED, FINISHED }

signal started(id: String)
signal cue(name: String, t: float)
signal finished(id: String)
signal skipped(id: String)
signal error(id: String, msg: String)

var state: State = State.IDLE
var active_id: String = ""
var active_instance: CutsceneBase = null
var _queue: Array = []

func play(id: String, params: Dictionary = {}) -> void:
	if state == State.PLAYING or state == State.PAUSED:
		_queue.append({ "id": id, "params": params })
		return
	_start_scene(id, params)

func _start_scene(id: String, params: Dictionary) -> void:
	state = State.LOADING
	active_id = id
	var scene_path := "res://cutscenes/%s/scene.tscn" % id
	if ResourceLoader.exists(scene_path):
		var packed := ResourceLoader.load(scene_path) as PackedScene
		if packed != null:
			active_instance = packed.instantiate() as CutsceneBase
			if active_instance != null:
				get_tree().root.add_child(active_instance)
				active_instance.cue_triggered.connect(_on_cue)
				active_instance.sequence_completed.connect(_on_sequence_completed)
				active_instance.configure(params)
				state = State.PLAYING
				started.emit(id)
				return
	# Dynamic AAA CinematicRig fallback when a custom .tscn is not present
	var rig := CinematicRig.new()
	var merged := params.duplicate()
	merged["cutsceneId"] = id
	active_instance = rig
	get_tree().root.add_child(active_instance)
	active_instance.cue_triggered.connect(_on_cue)
	active_instance.sequence_completed.connect(_on_sequence_completed)
	active_instance.configure(merged)
	state = State.PLAYING
	started.emit(id)

func pause() -> void:
	if state == State.PLAYING:
		state = State.PAUSED
		if active_instance != null:
			active_instance.pause_sequence()

func resume() -> void:
	if state == State.PAUSED:
		state = State.PLAYING
		if active_instance != null:
			active_instance.resume_sequence()

func skip() -> void:
	if state != State.PLAYING and state != State.PAUSED:
		return
	var sid := active_id
	_cleanup_active()
	state = State.FINISHED
	skipped.emit(sid)
	if WebBridge != null:
		WebBridge.emit_event_to_react("CUTSCENE_SKIPPED", { "cutsceneId": sid })
	_play_next_in_queue()

func stop() -> void:
	_queue.clear()
	_cleanup_active()
	state = State.IDLE

func _on_cue(cue_name: String, t: float) -> void:
	cue.emit(cue_name, t)
	if WebBridge != null:
		WebBridge.emit_event_to_react("CUTSCENE_CUE", { "cutsceneId": active_id, "cue": cue_name, "t": t })

func _on_sequence_completed() -> void:
	var fid := active_id
	_cleanup_active()
	state = State.FINISHED
	finished.emit(fid)
	if WebBridge != null:
		WebBridge.emit_event_to_react("CUTSCENE_COMPLETE", { "cutsceneId": fid })
	_play_next_in_queue()

func _cleanup_active() -> void:
	if active_instance != null:
		active_instance.stop_and_cleanup()
		active_instance = null
	active_id = ""

func _play_next_in_queue() -> void:
	if _queue.size() > 0:
		var next_item: Dictionary = _queue.pop_front()
		_start_scene(str(next_item["id"]), next_item["params"])
	else:
		state = State.IDLE
