import { PlayerAnimationAction } from '@/engine/types';

/**
 * Single configuration file defining articulated 3D footballer proportions,
 * skeletal joint swing amplitudes, and speeds so models can be customized
 * or swapped from one place.
 */
export interface PlayerModelConfig {
  torsoHeight: number;
  torsoWidth: number;
  headRadius: number;
  limbLength: number;
  upperArmLength: number;
  lowerArmLength: number;
  upperLegLength: number;
  lowerLegLength: number;
  animationParams: Record<
    PlayerAnimationAction,
    {
      bobSpeed: number;
      limbSwing: number;
      kneeBend: number;
      armRaise: number;
      leanAngle: number;
      jumpOffset: number;
      kickSwing: number;
    }
  >;
}

export const DEFAULT_PLAYER_MODEL_CONFIG: PlayerModelConfig = {
  torsoHeight: 0.72,
  torsoWidth: 0.46,
  headRadius: 0.21,
  limbLength: 0.65,
  upperArmLength: 0.34,
  lowerArmLength: 0.32,
  upperLegLength: 0.42,
  lowerLegLength: 0.4,
  animationParams: {
    idle: {
      bobSpeed: 1.8,
      limbSwing: 0.08,
      kneeBend: 0.06,
      armRaise: 0.05,
      leanAngle: 0.02,
      jumpOffset: 0,
      kickSwing: 0,
    },
    walk: {
      bobSpeed: 4.2,
      limbSwing: 0.42,
      kneeBend: 0.25,
      armRaise: 0.12,
      leanAngle: 0.06,
      jumpOffset: 0.02,
      kickSwing: 0,
    },
    run: {
      bobSpeed: 7.8,
      limbSwing: 0.78,
      kneeBend: 0.55,
      armRaise: 0.25,
      leanAngle: 0.14,
      jumpOffset: 0.06,
      kickSwing: 0,
    },
    sprint: {
      bobSpeed: 11.5,
      limbSwing: 1.12,
      kneeBend: 0.82,
      armRaise: 0.38,
      leanAngle: 0.24,
      jumpOffset: 0.1,
      kickSwing: 0,
    },
    pass: {
      bobSpeed: 6.2,
      limbSwing: 0.65,
      kneeBend: 0.35,
      armRaise: 0.3,
      leanAngle: 0.08,
      jumpOffset: 0.02,
      kickSwing: 0.85,
    },
    shoot: {
      bobSpeed: 8.5,
      limbSwing: 0.95,
      kneeBend: 0.5,
      armRaise: 0.55,
      leanAngle: -0.14,
      jumpOffset: 0.12,
      kickSwing: 1.35,
    },
    tackle: {
      bobSpeed: 5.5,
      limbSwing: 0.85,
      kneeBend: 0.6,
      armRaise: 0.4,
      leanAngle: 0.55,
      jumpOffset: -0.28,
      kickSwing: 0.95,
    },
    header: {
      bobSpeed: 6.5,
      limbSwing: 0.35,
      kneeBend: 0.45,
      armRaise: 0.65,
      leanAngle: 0.18,
      jumpOffset: 0.68,
      kickSwing: 0,
    },
    dive: {
      bobSpeed: 4.5,
      limbSwing: 0.5,
      kneeBend: 0.2,
      armRaise: 1.35,
      leanAngle: 1.05,
      jumpOffset: 0.22,
      kickSwing: 0,
    },
    celebrate: {
      bobSpeed: 9.2,
      limbSwing: 0.9,
      kneeBend: 0.4,
      armRaise: 1.45,
      leanAngle: -0.08,
      jumpOffset: 0.42,
      kickSwing: 0,
    },
  },
};
