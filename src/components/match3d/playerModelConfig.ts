import { PlayerAnimationAction } from '@/engine/types';

/**
 * Single configuration file defining procedural 3D character proportions, animation amplitudes,
 * and speeds so low-poly models can be customized or swapped from one place (M4 spec).
 */
export interface PlayerModelConfig {
  torsoHeight: number;
  torsoWidth: number;
  headRadius: number;
  limbLength: number;
  animationParams: Record<
    PlayerAnimationAction,
    {
      bobSpeed: number;
      limbSwing: number;
      leanAngle: number;
      jumpOffset: number;
    }
  >;
}

export const DEFAULT_PLAYER_MODEL_CONFIG: PlayerModelConfig = {
  torsoHeight: 0.95,
  torsoWidth: 0.52,
  headRadius: 0.24,
  limbLength: 0.65,
  animationParams: {
    idle: { bobSpeed: 1.5, limbSwing: 0.08, leanAngle: 0, jumpOffset: 0 },
    walk: { bobSpeed: 4.0, limbSwing: 0.35, leanAngle: 0.05, jumpOffset: 0 },
    run: { bobSpeed: 7.5, limbSwing: 0.65, leanAngle: 0.12, jumpOffset: 0.05 },
    sprint: { bobSpeed: 11.0, limbSwing: 0.95, leanAngle: 0.22, jumpOffset: 0.08 },
    pass: { bobSpeed: 6.0, limbSwing: 0.8, leanAngle: 0.1, jumpOffset: 0 },
    shoot: { bobSpeed: 8.0, limbSwing: 1.2, leanAngle: -0.15, jumpOffset: 0.1 },
    tackle: { bobSpeed: 5.0, limbSwing: 0.9, leanAngle: 0.45, jumpOffset: -0.25 },
    header: { bobSpeed: 6.0, limbSwing: 0.4, leanAngle: 0.15, jumpOffset: 0.65 },
    dive: { bobSpeed: 4.0, limbSwing: 0.7, leanAngle: 1.1, jumpOffset: 0.15 },
    celebrate: { bobSpeed: 9.0, limbSwing: 1.1, leanAngle: -0.1, jumpOffset: 0.45 },
  },
};
