mergeInto(LibraryManager.library, {
  NotifyUnityViewerReady: function () {
    window.addEventListener('message', function (ev) {
      var d = ev.data;
      if (!d || !d.type) return;
      if (d.type === 'PLAY_CUTSCENE' && window.unityInstance) {
        var payload = Object.assign({ cutsceneId: d.cutsceneId || 'player_signing' }, d.params || {});
        window.unityInstance.SendMessage('UnityWebBridge', 'PlayCutsceneFromReact', JSON.stringify(payload));
      }
    });
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'UNITY_VIEWER_READY' }, '*');
    }
  },
  EmitUnityCutsceneEvent: function (eventTypePtr, cutsceneIdPtr) {
    var eventType = UTF8ToString(eventTypePtr);
    var cutsceneId = UTF8ToString(cutsceneIdPtr);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: eventType, payload: { cutsceneId: cutsceneId } }, '*');
    }
  }
});
