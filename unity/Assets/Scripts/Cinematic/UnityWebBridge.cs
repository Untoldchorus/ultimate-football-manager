using System;
using System.Runtime.InteropServices;
using UnityEngine;

namespace UltimateFootballManager.Cinematic
{
    /// <summary>
    /// Bidirectional bridge between Next.js (React) and the Unity 6 WebGL Cinematic & Match Engine.
    /// Receives PLAY_CUTSCENE and LOAD_TIMELINE JSON payloads from the browser parent window.
    /// </summary>
    public class UnityWebBridge : MonoBehaviour
    {
        public static UnityWebBridge Instance { get; private set; }

        [Serializable]
        public class CutscenePayload
        {
            public string cutsceneId = "player_signing";
            public string primaryColor = "#dc2626";
            public string secondaryColor = "#ffffff";
            public string skinColor = "#8c5332";
            public string hairColor = "#0f0c0a";
            public float heightScale = 1.05f;
            public float buildScale = 1.0f;
            public int shirtNumber = 9;
            public string playerName = "New Signing";
            public string clubName = "FOOTBALL CLUB";
            public string quality = "high";
        }

        public event Action<CutscenePayload> OnCutsceneRequested;

#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")]
        private static extern void NotifyUnityViewerReady();

        [DllImport("__Internal")]
        private static extern void EmitUnityCutsceneEvent(string eventType, string cutsceneId);
#endif

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            gameObject.name = "UnityWebBridge";
        }

        private void Start()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            NotifyUnityViewerReady();
#endif
        }

        /// <summary>
        /// Called from JavaScript via SendMessage("UnityWebBridge", "PlayCutsceneFromReact", jsonString)
        /// </summary>
        public void PlayCutsceneFromReact(string jsonPayload)
        {
            if (string.IsNullOrWhiteSpace(jsonPayload)) return;
            var payload = JsonUtility.FromJson<CutscenePayload>(jsonPayload);
            if (payload != null)
            {
                OnCutsceneRequested?.Invoke(payload);
            }
        }

        public void NotifySequenceCompleted(string cutsceneId)
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            EmitUnityCutsceneEvent("CUTSCENE_COMPLETE", cutsceneId);
#endif
        }
    }
}
