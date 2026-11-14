#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace UltimateFootballManager.Editor
{
    public static class WebGLBuilder
    {
        [MenuItem("UFM/Build WebGL Cutscene Engine")]
        public static void BuildWebGL()
        {
            string[] scenes = { "Assets/Scenes/MatchStadiumCinematic.unity" };
            string outputPath = "../public/unity";

            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Brotli;
            PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.runInBackground = true;

            BuildPlayerOptions opts = new BuildPlayerOptions
            {
                scenes = scenes,
                locationPathName = outputPath,
                target = BuildTarget.WebGL,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(opts);
            if (report.summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"[UFM] Unity WebGL build succeeded: {report.summary.totalSize} bytes -> {outputPath}");
            }
            else
            {
                Debug.LogError($"[UFM] Unity WebGL build failed: {report.summary.result}");
            }
        }
    }
}
#endif
