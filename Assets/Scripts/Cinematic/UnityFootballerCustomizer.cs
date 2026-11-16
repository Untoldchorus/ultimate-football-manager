using UnityEngine;
using TMPro;

namespace UltimateFootballManager.Cinematic
{
    /// <summary>
    /// Applies per-player parametric appearance (club kit colors, skin tone, hair color,
    /// height & muscular build scaling, and 3D squad number/surname) to the rigged footballer prefab.
    /// </summary>
    public class UnityFootballerCustomizer : MonoBehaviour
    {
        [Header("Character Renderers & Text")]
        public SkinnedMeshRenderer bodyMeshRenderer;
        public TextMeshPro frontChestNumber;
        public TextMeshPro backJerseyNumber;
        public TextMeshPro backSurnameLabel;
        public TextMeshPro backdropClubLabel;
        public TextMeshPro backdropPlayerLabel;
        public MeshRenderer backdropArchRenderer;

        public void ApplyPlayerCustomization(UnityWebBridge.CutscenePayload p)
        {
            ColorUtility.TryParseHtmlString(p.primaryColor, out Color primary);
            ColorUtility.TryParseHtmlString(p.secondaryColor, out Color secondary);
            ColorUtility.TryParseHtmlString(p.skinColor, out Color skin);
            ColorUtility.TryParseHtmlString(p.hairColor, out Color hair);

            transform.localScale = new Vector3(
                p.heightScale * p.buildScale,
                p.heightScale,
                p.heightScale * p.buildScale
            );

            if (bodyMeshRenderer != null)
            {
                var mats = bodyMeshRenderer.materials;
                for (int i = 0; i < mats.Length; i++)
                {
                    string mName = mats[i].name;
                    if (mName.Contains("KitShirtMat") || mName.Contains("SocksMat"))
                    {
                        mats[i].color = primary;
                    }
                    else if (mName.Contains("KitSleeveMat"))
                    {
                        mats[i].color = secondary;
                    }
                    else if (mName.Contains("SkinMat"))
                    {
                        mats[i].color = skin;
                    }
                    else if (mName.Contains("HairMat"))
                    {
                        mats[i].color = hair;
                    }
                }
                bodyMeshRenderer.materials = mats;
            }

            string numStr = p.shirtNumber > 0 ? p.shirtNumber.ToString() : "9";
            string[] parts = (p.playerName ?? "SIGNING").Trim().Split(' ');
            string surname = parts[parts.Length - 1].ToUpperInvariant();

            if (frontChestNumber != null)
            {
                frontChestNumber.text = numStr;
                frontChestNumber.color = secondary;
            }
            if (backJerseyNumber != null)
            {
                backJerseyNumber.text = numStr;
                backJerseyNumber.color = secondary;
            }
            if (backSurnameLabel != null)
            {
                backSurnameLabel.text = surname;
                backSurnameLabel.color = secondary;
            }
            if (backdropArchRenderer != null)
            {
                backdropArchRenderer.material.color = Color.Lerp(primary, Color.black, 0.25f);
            }
            if (backdropClubLabel != null)
            {
                backdropClubLabel.text = (p.clubName ?? "FOOTBALL CLUB").ToUpperInvariant();
            }
            if (backdropPlayerLabel != null)
            {
                backdropPlayerLabel.text = $"#{numStr} {(p.playerName ?? surname).ToUpperInvariant()}";
                backdropPlayerLabel.color = secondary;
            }
        }
    }
}
