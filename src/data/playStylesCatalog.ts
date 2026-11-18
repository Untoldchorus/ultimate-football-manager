import { PlayStyleCategory, PlayStyleTier, PlayerPlayStyle } from '@/engine/types';

export interface PlayStyleDefinition {
  id: string;
  name: string;
  category: PlayStyleCategory;
  description: string;
  plusDescription: string;
}

export const PLAYSTYLES_CATALOG: PlayStyleDefinition[] = [
  // === SHOOTING ===
  {
    id: 'finesse_shot',
    name: 'Finesse Shot',
    category: 'Shooting',
    description: 'Performs finesse shots faster with additional curve and improved accuracy.',
    plusDescription: 'Performs finesse shots significantly faster with maximum curve and exceptional accuracy.',
  },
  {
    id: 'chip_shot',
    name: 'Chip Shot',
    category: 'Shooting',
    description: 'Performs chip shots faster and with greater accuracy.',
    plusDescription: 'Performs chip shots with pinpoint precision and rapid trajectory over goalkeepers.',
  },
  {
    id: 'power_shot',
    name: 'Power Shot',
    category: 'Shooting',
    description: 'Executes power shots faster and with increased velocity.',
    plusDescription: 'Executes power shots significantly faster with devastating ball speed and accuracy.',
  },
  {
    id: 'dead_ball',
    name: 'Dead Ball',
    category: 'Shooting',
    description: 'Set pieces are delivered with increased speed, curve, and accuracy.',
    plusDescription: 'Set pieces have maximum preview line length, exceptional speed, curve, and pinpoint accuracy.',
  },
  {
    id: 'power_header',
    name: 'Power Header',
    category: 'Shooting',
    description: 'Performs headers with increased power and accuracy.',
    plusDescription: 'Performs headers with maximum power and lethal accuracy from all attacking positions.',
  },

  // === PASSING ===
  {
    id: 'pinged_pass',
    name: 'Pinged Pass',
    category: 'Passing',
    description: 'Passes travel faster along the ground without being harder for teammates to control.',
    plusDescription: 'Passes travel with laser precision and maximum speed along the turf.',
  },
  {
    id: 'incisive_pass',
    name: 'Incisive Pass',
    category: 'Passing',
    description: 'Through balls are more accurate, and swerve passes have more curve.',
    plusDescription: 'Through balls deliver surgical precision, cutting open defenses through the tightest channels.',
  },
  {
    id: 'long_ball_pass',
    name: 'Long Ball Pass',
    category: 'Passing',
    description: 'Lobbed and lofted through passes travel faster and with pinpoint accuracy.',
    plusDescription: 'Lobbed passes are launched with maximum velocity and land perfectly into teammate stride.',
  },
  {
    id: 'tiki_taka',
    name: 'Tiki Taka',
    category: 'Passing',
    description: 'Executes difficult first-time ground passes with high accuracy.',
    plusDescription: 'Executes lightning-quick first-time one-twos and flicked passes with perfection.',
  },
  {
    id: 'whipped_pass',
    name: 'Whipped Pass',
    category: 'Passing',
    description: 'All crosses are whipped in with high speed, curve, and accuracy.',
    plusDescription: 'Crosses bend viciously around defenders with maximum whip and attacking target accuracy.',
  },

  // === BALL CONTROL ===
  {
    id: 'first_touch',
    name: 'First Touch',
    category: 'Ball Control',
    description: 'Has reduced error when trapping the ball and transitions to dribbling faster.',
    plusDescription: 'Deadens incoming high-speed balls instantly with zero trap error under heavy press.',
  },
  {
    id: 'flair',
    name: 'Flair',
    category: 'Ball Control',
    description: 'Fancy passes and shots are performed with improved context and accuracy.',
    plusDescription: 'Executes audacious rabonas, no-look passes, and heel flicks with supreme ease.',
  },
  {
    id: 'press_proven',
    name: 'Press Proven',
    category: 'Ball Control',
    description: 'Keeps exceptionally close control of the ball while jogging and shielding.',
    plusDescription: 'Shields the ball with immense balance and retains possession under multi-defender pressure.',
  },
  {
    id: 'rapid',
    name: 'Rapid',
    category: 'Ball Control',
    description: 'Reaches higher sprint speed while dribbling and reduces knock-on errors.',
    plusDescription: 'Sprints at breakneck speed with the ball glued to feet in open pitch transitions.',
  },
  {
    id: 'technical',
    name: 'Technical',
    category: 'Ball Control',
    description: 'Reaches higher speed when performing controlled sprint with precision touches.',
    plusDescription: 'Glides past opponents with controlled close-touch acceleration and micro-turns.',
  },
  {
    id: 'trickster',
    name: 'Trickster',
    category: 'Ball Control',
    description: 'Grants the ability to perform unique flick and agility skill moves.',
    plusDescription: 'Unlocks exclusive freestyle skill moves and deceptive body feints.',
  },

  // === DEFENDING ===
  {
    id: 'block',
    name: 'Block',
    category: 'Defending',
    description: 'Increased reach when performing blocks and improved success rate.',
    plusDescription: 'Dives into shot trajectories with immense reach and blocks goal-bound efforts consistently.',
  },
  {
    id: 'bruiser',
    name: 'Bruiser',
    category: 'Defending',
    description: 'Greater physical strength when performing shoulder challenges and physical tackles.',
    plusDescription: 'Dominates physical duels and knocks attackers off balance with relentless strength.',
  },
  {
    id: 'intercept',
    name: 'Intercept',
    category: 'Defending',
    description: 'Increased reach and improved chances of retaining possession on interceptions.',
    plusDescription: 'Anticipates passing lines with elite reading and snaps passes cleanly into team possession.',
  },
  {
    id: 'jockey',
    name: 'Jockey',
    category: 'Defending',
    description: 'Increased max speed of sprint jockey and improved transition into tackle.',
    plusDescription: 'Matches attacker step-for-step with rapid sprint-jockey agility and lightning change of direction.',
  },
  {
    id: 'slide_tackle',
    name: 'Slide Tackle',
    category: 'Defending',
    description: 'Grants the ability to stop the ball directly at the feet when sliding.',
    plusDescription: 'Performs sliding tackles with pinpoint recovery, retaining the ball directly in play.',
  },
  {
    id: 'anticipate',
    name: 'Anticipate',
    category: 'Defending',
    description: 'Improved chances of standing tackle success and winning the ball clean without fouls.',
    plusDescription: 'Executes picture-perfect standing tackles that cleanly confiscate possession without committing fouls.',
  },

  // === PHYSICAL ===
  {
    id: 'acrobatic',
    name: 'Acrobatic',
    category: 'Physical',
    description: 'Performs volleys with improved accuracy and unique acrobatic body positioning.',
    plusDescription: 'Connects with scissor kicks, bicycle kicks, and flying volleys with sublime technique.',
  },
  {
    id: 'aerial',
    name: 'Aerial',
    category: 'Physical',
    description: 'Performs higher jumps and has improved aerial physical presence.',
    plusDescription: 'Out-jumps opponents with soaring vertical hang-time and towering aerial dominance.',
  },
  {
    id: 'trivela',
    name: 'Trivela',
    category: 'Physical',
    description: 'Contextually triggers outside-of-the-foot passes and shots.',
    plusDescription: 'Master of the outside-foot strike; curls passes and shots with exceptional outside curve.',
  },
  {
    id: 'relentless',
    name: 'Relentless',
    category: 'Physical',
    description: 'Reduces fatigue during play and increases stamina recovery during halftime.',
    plusDescription: 'Never stops running; maintains near-peak physical intensity through 90+ minutes.',
  },
  {
    id: 'quick_step',
    name: 'Quick Step',
    category: 'Physical',
    description: 'Accelerates faster during explosive sprint bursts.',
    plusDescription: 'Explodes off the mark with instant maximum acceleration that leaves defenders flat-footed.',
  },
  {
    id: 'long_throw',
    name: 'Long Throw',
    category: 'Physical',
    description: 'Can throw the ball further with greater velocity into the box.',
    plusDescription: 'Launches catapult-like throw-ins directly into the penalty area as dangerous set pieces.',
  },

  // === GOALKEEPING ===
  {
    id: 'far_throw',
    name: 'Far Throw',
    category: 'Goalkeeping',
    description: 'Can target outfield players further away with accurate thrown distribution.',
    plusDescription: 'Launches rapid counter-attacks with deep pinpoint throws past the halfway line.',
  },
  {
    id: 'footwork',
    name: 'Footwork',
    category: 'Goalkeeping',
    description: 'Performs saves with feet more frequently on low close-range shots.',
    plusDescription: 'Reacts instantaneously to low point-blank strikes using elite leg and foot reactions.',
  },
  {
    id: 'cross_claimer',
    name: 'Cross Claimer',
    category: 'Goalkeeping',
    description: 'Will attempt to intercept crosses if reachable slightly before opponent.',
    plusDescription: 'Dominates aerial territory, fearlessly claiming high crosses through crowded boxes.',
  },
  {
    id: 'rush_out',
    name: 'Rush Out',
    category: 'Goalkeeping',
    description: 'Is aggressive when coming out of the penalty box to collect loose and through balls.',
    plusDescription: 'Operates as a high-speed sweeper-keeper, smothering through balls before attackers arrive.',
  },
  {
    id: 'far_reach',
    name: 'Far Reach',
    category: 'Goalkeeping',
    description: 'More effective at tipping and saving shots from outside the box.',
    plusDescription: 'Extends full wing span to claw away top-corner long shots with superhuman reach.',
  },
  {
    id: 'quick_reflexes',
    name: 'Quick Reflexes',
    category: 'Goalkeeping',
    description: 'Has increased reflexes and reactions when saving shots from inside the box.',
    plusDescription: 'Instinctively repels point-blank deflections and close-range strikes with cat-like reflexes.',
  },
];

export const PLAYSTYLE_MAP: Map<string, PlayStyleDefinition> = new Map(
  PLAYSTYLES_CATALOG.map((ps) => [ps.id, ps])
);

/**
 * Creates a concrete PlayerPlayStyle instance with chosen tier.
 */
export function createPlayStyle(id: string, tier: PlayStyleTier = 'standard'): PlayerPlayStyle | null {
  const def = PLAYSTYLE_MAP.get(id);
  if (!def) return null;
  return {
    id: def.id,
    name: def.name,
    category: def.category,
    tier,
    description: tier === 'plus' ? def.plusDescription : def.description,
  };
}

export const COMMON_PLAYER_TRAITS = [
  'Finesse Shot',
  'Outside Foot Shot',
  'Power Header',
  'Long Throw-In',
  'Early Crosser',
  'Speed Dribbler',
  'Playmaker',
  'Solid Player',
  'Injury Prone',
  'Leadership',
  'Team Player',
  'Chip Shot',
  'Swerve Pass',
  'Giant Throw-In',
  'Rushes Out Of Goal',
  'GK Cautious With Crosses',
  'GK Comes For Crosses',
  'Saves With Feet',
];
