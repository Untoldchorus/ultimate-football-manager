export type PositionCode = 'GK' | 'RB' | 'CB' | 'LB' | 'CDM' | 'CM' | 'CAM' | 'RW' | 'LW' | 'ST';

export type FormationCode =
  | '4-3-3'
  | '4-2-3-1'
  | '4-4-2'
  | '3-5-2'
  | '3-4-3'
  | '4-1-4-1'
  | '5-3-2'
  | '4-3-1-2'
  | '4-2-2-2'
  | '5-4-1';

export type TacticalPlayingStyle =
  | 'gegenpress'
  | 'tikiTaka'
  | 'directCounter'
  | 'wingPlay'
  | 'parkTheBus'
  | 'highPress'
  | 'longBall'
  | 'possession'
  | 'catenaccio'
  | 'totalFootball'
  | 'midBlock'
  | 'balanced';

export type TacticalMatchupOutcome = 'Strong' | 'Neutral' | 'Weak';

export interface ExtendedPlayerAttributes extends PlayerAttributes {
  // Additional Technical
  shortPassing: number;
  longPassing: number;
  throughBalls: number;
  setPieces: number;
  technique: number;
  curve: number;
  // Additional Physical
  sprintSpeed: number;
  naturalFitness: number;
  recovery: number;
  // Additional Mental
  concentration: number;
  determination: number;
  teamwork: number;
  offTheBall: number;
  bravery: number;
  tacticalIntelligence: number;
  consistency: number;
  // Additional Defensive
  interceptions: number;
  defensivePositioning: number;
  defensiveAwareness: number;
  slidingTackles: number;
  // Additional Goalkeeping
  oneOnOnes: number;
  commandOfArea: number;
  communication: number;
  kicking: number;
}

export interface PlayerAttributes {
  // Technical (11)
  passing: number;
  shooting: number;
  finishing: number;
  dribbling: number;
  ballControl: number;
  crossing: number;
  tackling: number;
  marking: number;
  firstTouch: number;
  heading: number;
  longShots: number;
  freeKicks: number;
  penalties: number;
  // Physical (7)
  pace: number;
  acceleration: number;
  strength: number;
  stamina: number;
  jumping: number;
  balance: number;
  agility: number;
  // Mental (8)
  vision: number;
  positioning: number;
  decisions: number;
  composure: number;
  leadership: number;
  workRate: number;
  aggression: number;
  anticipation: number;
  // Goalkeeper (6)
  reflexes: number;
  handling: number;
  distribution: number;
  diving: number;
  aerialAbility: number;
  gkPositioning: number;
}

export interface PlayerCareerHistoryEntry {
  season: string;
  clubId: string;
  clubName: string;
  appearances: number;
  goals: number;
  assists: number;
}

export type PlayerImageStatus = 'verified' | 'unverified' | 'broken' | 'missing';

export interface PlayerImageRecord {
  player_id: string;
  player_name: string;
  club_id: string;
  league_id: string;
  country_id: string;
  image_url: string;
  local_image_path?: string;
  source_name: string;
  source_url: string;
  image_license: string;
  attribution: string;
  identity_verified: boolean;
  image_status: PlayerImageStatus;
  last_verified: string;
}

export interface AssetManifestEntry {
  entityId: string;
  entityType: 'club' | 'player' | 'competition' | 'stadium';
  assetPathOrUrl: string;
  assetType: 'svg-crest' | 'png-crest' | 'licensed-photo' | 'generated-avatar';
  license: string;
  attribution: string;
  verifiedDateIso: string;
  isGeneratedFallback: boolean;
}

export interface CountryEntity {
  id: string;
  name: string;
  code: string; // ISO-3166 alpha-3 e.g. ENG, ESP, GER
  confederation: 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'AFC' | 'CAF';
  flagEmoji: string;
  worldRank?: number; // 1..20 global football nation rank
  rankingMethodology?: string;
}

export interface CompetitionRules {
  expectedClubCount?: number;
  expectedMinSquadSize?: number;
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  promotionSpots: number;
  relegationSpots: number;
  continentalQualificationSpots: number;
  maxSubstitutesOnBench: number;
  maxSquadRegistration: number;
  transferWindowWeeks: number[];
  competitionFormat?: 'double_round_robin' | 'split_phase' | 'apertura_clausura' | 'conference_playoffs' | 'knockout';
}

export interface LeagueCompetitionEntity {
  id: string;
  name: string;
  shortName: string;
  countryId: string;
  tier: number; // 1 = top flight, 2 = second tier, 0 = cup/continental
  type: 'league' | 'domesticCup' | 'continentalCup';
  reputation: number;
  populatedStatus: 'populated' | 'expandable_unpopulated';
  promotedToLeagueId?: string;
  relegatedToLeagueId?: string;
  domesticCupId?: string;
  continentalCupId?: string;
  rules: CompetitionRules;
}

export interface PlayerSeasonStats {
  appearances: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  averageRating: number;
  minutesPlayed: number;
}

export type PlayerPersonality =
  | 'Leader'
  | 'TeamPlayer'
  | 'ModelProfessional'
  | 'Ambitious'
  | 'Maverick'
  | 'Temperamental';

export type TacticalPlayerRole =
  | 'AdvancedForward'
  | 'CompleteForward'
  | 'Poacher'
  | 'FalseNine'
  | 'TargetForward'
  | 'InsideForward'
  | 'Winger'
  | 'InvertedWinger'
  | 'DeepLyingPlaymaker'
  | 'BoxToBox'
  | 'BallWinningMidfielder'
  | 'AdvancedPlaymaker'
  | 'DefensiveMidfielder'
  | 'BallPlayingDefender'
  | 'CentralDefender'
  | 'Fullback'
  | 'Wingback'
  | 'InvertedFullback'
  | 'SweeperKeeper'
  // Legacy aliases preserved for save compatibility
  | 'ShotStopper'
  | 'StopperCB'
  | 'AttackingFullback'
  | 'DefensiveFullback'
  | 'AnchorMan'
  | 'TraditionalWinger';

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  dateOfBirth?: string;
  heightCm?: number;
  preferredFoot?: 'Right' | 'Left' | 'Both';
  shirtNumber?: number;
  nationality: string;
  spokenLanguages?: string[];
  personality?: PlayerPersonality;
  tacticalRole?: TacticalPlayerRole;
  joinedClubWeek?: number;
  joinedClubSeason?: number;
  clubId: string;
  loanedFromClubId?: string | null;
  primaryPosition: PositionCode;
  secondaryPositions: PositionCode[];
  positionalFamiliarity?: Partial<Record<PositionCode, number>>; // 0..100 learned familiarity per position
  attributes: PlayerAttributes;
  overall: number;
  potential: number;
  contractEndSeason: number;
  weeklyWage: number;
  marketValue: number;
  releaseClause?: number;
  agentFeePct?: number;
  internationalApps?: number;
  internationalGoals?: number;
  photoUrl?: string;
  photoAssetId?: string;
  careerHistory?: PlayerCareerHistoryEntry[];
  fitness: number; // 0..100 overall pre-match physical readiness
  stamina?: number; // 0..100 immediately available in-match stamina
  fatigue?: number; // 0..100 accumulated exhaustion across matches & training
  consecutiveMatches?: number; // consecutive match appearances without rest
  morale: number; // 0..100
  form: number; // 1..10
  injuryWeeks: number; // 0 = healthy
  injuryType?: string;
  roleExpectation: 'star' | 'starter' | 'rotation' | 'prospect';
  transferListed: boolean;
  transferRequested: boolean;
  isYouth: boolean;
  seasonGrowth: number; // tracks attribute points gained this season (capped)
  stats: PlayerSeasonStats;
}

export type AttackingStyle = TacticalPlayingStyle;
export type PressingIntensity = 'low' | 'medium' | 'high' | 'gegenpress';
export type DefensiveLine = 'deep' | 'standard' | 'high';
export type TacticalMentality = 'ultraDefensive' | 'defensive' | 'balanced' | 'attacking' | 'allOutAttack';

export interface TacticsConfig {
  formation: FormationCode;
  attackingStyle: AttackingStyle;
  playingStyle?: TacticalPlayingStyle; // canonical 12-style philosophy
  pressing: PressingIntensity;
  defensiveLine: DefensiveLine;
  width: number; // 1..100 (Attacking width)
  tempo: number; // 1..100 (Passing tempo)
  directness: number; // 1..100 (Passing directness)
  mentality: TacticalMentality;
  counterPressing: boolean;
  offsideTrap: boolean;
  // Extended FC27 Custom Tactical Instructions (1..100 or boolean)
  transitionSpeed?: number; // 1..100
  defensiveCompactness?: number; // 1..100
  overlappingRuns?: boolean;
  underlappingRuns?: boolean;
  playerFreedom?: number; // 1..100
  creativeFreedom?: number; // 1..100
  forwardMovement?: number; // 1..100
  defensivePositioning?: 'zonal' | 'manMarking' | 'hybrid';
  roleOverrides?: Record<number, TacticalPlayerRole>; // slotIndex 0..10 -> role
}

export interface TacticalPreset {
  id: string;
  name: string;
  createdAtIso: string;
  tactics: TacticsConfig;
}

export type TrainingFocus =
  | 'attacking'
  | 'defending'
  | 'passing'
  | 'shooting'
  | 'fitness'
  | 'goalkeeping'
  | 'tactical';

export interface WeeklyTrainingSchedule {
  monday: TrainingFocus;
  tuesday: TrainingFocus;
  wednesday: TrainingFocus;
  thursday: TrainingFocus;
  friday: TrainingFocus;
  intensity: 'light' | 'balanced' | 'heavy';
}

export interface ClubFinances {
  transferBudget: number;
  wageBudgetWeekly: number;
  currentWageBillWeekly: number;
  cashBalance: number;
  matchdayRevenuePerHomeGame: number;
  weeklySponsorIncome: number;
  weeklyStaffAndStadiumCost: number;
  seasonPrizeMoneyEarned: number;
  ledger: FinanceTransaction[];
}

export interface FinanceTransaction {
  id: string;
  week: number;
  season: number;
  category: 'matchday' | 'sponsorship' | 'wages' | 'maintenance' | 'transferIn' | 'transferOut' | 'prize';
  description: string;
  amount: number; // positive = income, negative = expense
}

export type FinancialStatus = 'Rich' | 'Secure' | 'Stable' | 'Tight' | 'Restricted';

export interface Club {
  id: string;
  name: string;
  shortName: string;
  division: 1 | 2;
  countryId?: string;
  city?: string;
  leagueId?: string;
  foundedYear?: number;
  financialStatus?: FinancialStatus;
  managerName?: string;
  rivalClubIds?: string[];
  clubHistory?: string;
  badgeAssetId?: string;
  captainId?: string;
  viceCaptainId?: string;
  primaryColor: string;
  secondaryColor: string;
  stadiumName: string;
  stadiumCapacity: number;
  reputation: number; // 1..100
  tactics: TacticsConfig;
  startingXI: string[]; // 11 player IDs ordered by slot 0..10
  substitutes: string[]; // up to 7 player IDs
  reserves: string[]; // remaining player IDs
  training: WeeklyTrainingSchedule;
  finances: ClubFinances;
}

export type MatchEventType =
  | 'kickoff'
  | 'pass'
  | 'throughBall'
  | 'cross'
  | 'shot'
  | 'save'
  | 'goal'
  | 'tackle'
  | 'interception'
  | 'foul'
  | 'yellowCard'
  | 'redCard'
  | 'corner'
  | 'freeKick'
  | 'penalty'
  | 'injury'
  | 'substitution'
  | 'halfTime'
  | 'fullTime';

export interface Vector2D {
  x: number; // 0..100 (left to right)
  y: number; // 0..100 (top to bottom)
}

export type PlayerAnimationAction =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sprint'
  | 'pass'
  | 'shoot'
  | 'tackle'
  | 'header'
  | 'dive'
  | 'celebrate';

export interface PlayerPositionSnapshot {
  playerId: string;
  teamId: string;
  x: number;
  y: number;
  action: PlayerAnimationAction;
}

export interface MatchEvent {
  id: string;
  minute: number;
  second: number;
  type: MatchEventType;
  teamId: string;
  playerId?: string;
  secondaryPlayerId?: string;
  ballPosition: Vector2D;
  playerPositions?: PlayerPositionSnapshot[];
  outcome: 'success' | 'fail' | 'neutral';
  metadata?: {
    commentary?: string;
    homeScore?: number;
    awayScore?: number;
    xg?: number;
    onTarget?: boolean;
    cardReason?: string;
    injuryWeeks?: number;
    subInId?: string;
    subOutId?: string;
    isHeader?: boolean;
  };
}

export interface MatchTeamStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  xg: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  corners: number;
  // Extended FC27 Match Telemetry
  playingStyle?: TacticalPlayingStyle;
  tacticalMatchupOutcome?: TacticalMatchupOutcome;
  tacticalAdvantagePct?: number;
  tacticalAdaptationScore?: number;
  pressingSuccessPct?: number;
  runningDistanceKm?: number;
  sprintDistanceKm?: number;
  avgStaminaEnd?: number;
  avgFatigueAdded?: number;
  aiMidMatchSwitchedStyle?: TacticalPlayingStyle;
}

export interface MatchResult {
  fixtureId: string;
  seed: number;
  homeClubId: string;
  awayClubId: string;
  homeScore: number;
  awayScore: number;
  homeStats: MatchTeamStats;
  awayStats: MatchTeamStats;
  events: MatchEvent[];
  playerRatings: Record<string, number>;
  manOfTheMatchPlayerId: string;
  playerStaminaRemaining?: Record<string, number>;
  playerFatigueDelta?: Record<string, number>;
}

export interface MatchSimulationInput {
  fixtureId: string;
  homeClub: Club;
  awayClub: Club;
  homePlayers: Player[];
  awayPlayers: Player[];
  isNeutralVenue?: boolean;
  homeChemistryScore?: number; // 0..100
  awayChemistryScore?: number; // 0..100
  homeSynergyScore?: number; // 0..100
  awaySynergyScore?: number; // 0..100
  homeActiveBoosters?: ActiveBoosterInstance[];
  awayActiveBoosters?: ActiveBoosterInstance[];
  homePositionBoosters?: ActivePositionBooster[];
  awayPositionBoosters?: ActivePositionBooster[];
  currentSeason?: number;
  homeManagerAttributes?: ManagerAttributes;
  awayManagerAttributes?: ManagerAttributes;
  balanceConfig?: BalanceConfiguration;
}

export type CompetitionType =
  | 'division1'
  | 'division2'
  | 'domesticCup'
  | 'championsCup'
  | 'superCup'
  | 'europaLeague'
  | 'conferenceLeague'
  | string;

export interface Fixture {
  id: string;
  season: number;
  week: number;
  competition: CompetitionType;
  roundName?: string;
  homeClubId: string;
  awayClubId: string;
  played: boolean;
  result?: MatchResult;
}

export interface StandingsRow {
  clubId: string;
  clubName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export interface Scout {
  id: string;
  name: string;
  nationality: string;
  rating: number; // 1..100 accuracy
  assignedRegion: string;
  assignedPosition: PositionCode | 'ALL';
}

export interface ScoutingReport {
  id: string;
  playerId: string;
  scoutId: string;
  weekGenerated: number;
  estimatedOverallMin: number;
  estimatedOverallMax: number;
  estimatedPotentialMin: number;
  estimatedPotentialMax: number;
  estimatedValue: number;
  recommendation: 'signImmediately' | 'monitor' | 'pass';
  notes: string;
}

export interface BoardState {
  confidence: number; // 0..100 (< 25 risks dismissal)
  targetLeaguePosition: number;
  targetCupRound: string;
  wageBudgetStrictness: number;
  expectationsText: string;
  warningsCount: number;
  isSacked: boolean;
}

export interface TrophyRecord {
  id: string;
  season: number;
  competition: CompetitionType;
  competitionName: string;
  winnerClubId: string;
  winnerClubName: string;
  runnerUpClubId: string;
  runnerUpClubName: string;
}

export interface SeasonHistorySummary {
  season: number;
  clubId: string;
  clubName: string;
  division: 1 | 2;
  finalPosition: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  topScorerName: string;
  topScorerGoals: number;
  trophiesWon: string[];
}

export interface TransferRecord {
  id: string;
  season: number;
  week: number;
  playerId: string;
  playerName: string;
  fromClubId: string;
  fromClubName: string;
  toClubId: string;
  toClubName: string;
  fee: number;
  agentFee?: number;
  isLoan: boolean;
  isLoanToBuy?: boolean;
  loanBuyOptionFee?: number;
}

export type CanonicalCutsceneId =
  | 'manager_intro'
  | 'stadium_entrance'
  | 'tunnel_walkout'
  | 'pre_match_talk'
  | 'goal_celebration'
  | 'half_time_talk'
  | 'red_card_reaction'
  | 'missed_penalty'
  | 'full_time'
  | 'player_signing'
  | 'trophy_presentation'
  | 'league_championship'
  | 'career_milestone';

export type CutsceneType =
  | CanonicalCutsceneId
  | 'managerIntro'
  | 'tunnelWalkout'
  | 'preMatchTalk'
  | 'goalCelebration'
  | 'halfTimeTalk'
  | 'redCardReaction'
  | 'missedPenalty'
  | 'fullTime'
  | 'playerSigning'
  | 'trophyPresentation'
  | 'leagueChampionship';

export interface ActiveCutscene {
  type: CutsceneType;
  title: string;
  subtitle: string;
  primaryColor?: string;
  secondaryColor?: string;
  playerId?: string;
  playerName?: string;
  shirtNumber?: number;
  position?: PositionCode;
  overall?: number;
  nationality?: string;
  heightCm?: number;
  strength?: number;
  photoUrl?: string;
  skinColor?: string;
  hairColor?: string;
  clubName?: string;
  scoreText?: string;
}

export interface ManagerAttributes {
  tacticalIntelligence: number; // 0..100
  tacticalAdaptability: number; // 0..100
  manManagement: number; // 0..100
  motivationalAbility: number; // 0..100
  trainingQuality: number; // 0..100
  playerDevelopment: number; // 0..100
  matchPreparation: number; // 0..100
  tacticalFlexibility: number; // 0..100
}

export type CareerType = 'original_team' | 'real_club';

export interface OriginalClubIdentityConfig {
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  stadiumName: string;
}

export interface ManagerProfile {
  name: string;
  nationality: string;
  tacticalStyle: AttackingStyle;
  difficulty: 'relaxed' | 'standard' | 'hardcore';
  startingChallenge: 'none' | 'financialCrisis' | 'youthOnly' | 'titleOrBust';
  clubId: string;
  careerType?: CareerType;
  originalClubConfig?: OriginalClubIdentityConfig;
  attributes?: ManagerAttributes;
  savedPresets?: TacticalPreset[];
}

export interface NewsItem {
  id: string;
  week: number;
  season: number;
  title: string;
  body: string;
  category: 'match' | 'transfer' | 'board' | 'injury' | 'youth' | 'cup' | 'economy' | 'chemistry';
}

// ============================================================================
// CHEMISTRY, SYNERGY, BOOSTER ECONOMY, MONETIZATION & BALANCING TYPES
// ============================================================================

export type ChemistryLevelLabel =
  | 'Unfamiliar'
  | 'Developing'
  | 'Familiar'
  | 'Strong Understanding'
  | 'Excellent Understanding'
  | 'Exceptional Understanding';

export type SynergyLevelLabel =
  | 'Poor Compatibility'
  | 'Limited Compatibility'
  | 'Average Compatibility'
  | 'Good Compatibility'
  | 'Excellent Compatibility'
  | 'Exceptional Compatibility';

export interface PlayerPairChemistryRecord {
  pairKey: string; // sorted `${idA}__${idB}`
  playerAId: string;
  playerBId: string;
  clubId: string;
  matchesTogether: number;
  minutesTogether: number;
  trainingSessionsTogether: number;
  weeksSinceLastPlayedTogether: number;
  dynamicFamiliarityBonus: number; // -15..+35 earned from playing/training together
  lastUpdatedSeason: number;
  lastUpdatedWeek: number;
}

export interface ChemistryFactorBreakdown {
  matchesPlayedScore: number;
  minutesPlayedScore: number;
  sharedNationalityScore: number;
  sharedLanguageScore: number;
  previousClubScore: number;
  internationalTeammateScore: number;
  positionalFamiliarityScore: number;
  playingRelationshipScore: number;
  personalityCompatibilityScore: number;
  communicationLeadershipScore: number;
  transferAdaptationPenalty: number;
}

export interface PartnershipChemistryEvaluation {
  pairKey: string;
  playerAId: string;
  playerBId: string;
  playerAName: string;
  playerBName: string;
  slotIndexA: number;
  slotIndexB: number;
  isTacticallyLinked: boolean;
  score: number; // 0..100
  level: ChemistryLevelLabel;
  matchesTogether: number;
  minutesTogether: number;
  factors: ChemistryFactorBreakdown;
  summaryReason: string;
}

export interface IndividualPlayerChemistryEvaluation {
  playerId: string;
  playerName: string;
  positionSlot: PositionCode;
  primaryPosition: PositionCode;
  positionalFamiliarity: number; // 0..100
  averageTeammateChemistry: number; // 0..100
  individualChemistry: number; // 0..100
  level: ChemistryLevelLabel;
  adaptationWeeksRemaining: number;
}

export interface ChemistryHistorySnapshot {
  season: number;
  week: number;
  teamChemistry: number;
  teamSynergy: number;
  note: string;
}

export interface TeamChemistryReport {
  clubId: string;
  overallChemistry: number; // 0..100
  level: ChemistryLevelLabel;
  individualPlayers: IndividualPlayerChemistryEvaluation[];
  partnerships: PartnershipChemistryEvaluation[];
  strongestPartnerships: PartnershipChemistryEvaluation[];
  weakestPartnerships: PartnershipChemistryEvaluation[];
  improvementOpportunities: string[];
  matchPerformanceModifierPct: number; // e.g. -2.2% to +3.0%
}

export interface SynergyFactorBreakdown {
  roleCompatibilityScore: number;
  positionalRelationshipScore: number;
  tacticalInstructionScore: number;
  formationCompatibilityScore: number;
  complementaryAttributesScore: number;
  playingStyleCompatibilityScore: number;
  defensiveAttackingBalanceScore: number;
  playerPositioningScore: number;
  tacticalFamiliarityScore: number;
  teamStructureScore: number;
}

export interface PartnershipSynergyEvaluation {
  playerAId: string;
  playerBId: string;
  playerAName: string;
  playerBName: string;
  roleA: TacticalPlayerRole;
  roleB: TacticalPlayerRole;
  positionA: PositionCode;
  positionB: PositionCode;
  score: number; // 0..100
  level: SynergyLevelLabel;
  archetypeLabel: string; // e.g. "Anchor Covering Attacking Fullback"
  explanation: string;
}

export interface TeamSynergyReport {
  clubId: string;
  formation: FormationCode;
  overallSynergy: number; // 0..100
  level: SynergyLevelLabel;
  defensiveSynergy: number; // 0..100
  midfieldSynergy: number; // 0..100
  attackingSynergy: number; // 0..100
  positionalUnitSynergy: {
    backline: number;
    engineRoom: number;
    frontline: number;
    leftFlank: number;
    rightFlank: number;
  };
  partnerships: PartnershipSynergyEvaluation[];
  factors: SynergyFactorBreakdown;
  tacticalInsights: string[];
  matchPerformanceModifierPct: number; // e.g. -2.8% to +4.0%
}

export type BoosterCategory =
  | 'training'
  | 'chemistry'
  | 'synergy'
  | 'recovery'
  | 'fitness'
  | 'position'
  | 'morale'
  | 'cosmetic';

export type ItemRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export type AcquisitionSource =
  | 'daily_login'
  | 'daily_objective'
  | 'weekly_objective'
  | 'achievement'
  | 'tournament_reward'
  | 'rewarded_ad'
  | 'store_soft'
  | 'store_premium'
  | 'starter_pack'
  | 'special_event'
  | 'seasonal_reward';

export interface BoosterItemDefinition {
  itemId: string;
  name: string;
  description: string;
  category: BoosterCategory;
  subType:
    | 'training_xp'
    | 'technical_dev'
    | 'physical_dev'
    | 'tactical_dev'
    | 'chemistry_training'
    | 'partnership_training'
    | 'team_bonding'
    | 'tactical_preparation'
    | 'positional_training'
    | 'unit_coordination'
    | 'recovery_pack'
    | 'condition_pack'
    | 'fatigue_recovery'
    | 'individual_fitness'
    | 'team_fitness'
    | 'individual_recovery'
    | 'team_recovery'
    | 'season_position'
    | 'temporary_position'
    | 'team_morale'
    | 'individual_morale'
    | 'leadership_motivation'
    | 'founders_cosmetic';
  rarity: ItemRarity;
  durationWeeks: number; // 0 = instant consumable, >0 = active for N weeks/matches
  effectStrength: number; // e.g. +8 fitness, +15% training XP, +4 chemistry points
  priority: number; // higher priority wins if conflicting
  conflictGroup: string; // prevents conflicting simultaneous effects
  targetScope: 'player' | 'pair' | 'team' | 'club_cosmetic';
  cooldownWeeks: number;
  maxActivePerPlayer: number;
  expirationWeeks?: number; // inventory shelf life if applicable (undefined = never expires)
  softCurrencyPrice?: number;
  premiumCurrencyPrice?: number;
  usageRestrictionsText: string;
}

export interface ActivePositionBooster {
  boosterId: string;
  itemId: string;
  playerId: string;
  playerName: string;
  clubId: string;
  naturalPosition: PositionCode;
  unlockedPosition: PositionCode;
  boosterType: 'season_position' | 'temporary_position';
  familiarityGranted: number; // e.g. 92 (out of 100)
  activatedSeason: number;
  activatedWeek: number;
  expiresAtEndOfSeason?: number; // for 1-season position booster
  remainingMatches?: number; // 3..0 for temporary 3-match position booster
  status: 'active' | 'expired';
}

export interface InventoryItemRecord {
  instanceId: string;
  itemId: string;
  quantity: number;
  acquiredAtIso: string;
  acquiredWeek: number;
  acquiredSeason: number;
  source: AcquisitionSource;
  expiresAtWeek?: number;
  expiresAtSeason?: number;
}

export interface ActiveBoosterInstance {
  activeId: string;
  itemId: string;
  name: string;
  category: BoosterCategory;
  subType: BoosterItemDefinition['subType'];
  rarity: ItemRarity;
  effectStrength: number;
  priority: number;
  conflictGroup: string;
  targetPlayerId?: string;
  secondaryPlayerId?: string;
  clubId: string;
  activatedWeek: number;
  activatedSeason: number;
  remainingWeeks: number;
}

export interface BoosterUsageHistoryEntry {
  id: string;
  itemId: string;
  itemName: string;
  rarity: ItemRarity;
  category: BoosterCategory;
  usedAtIso: string;
  season: number;
  week: number;
  targetDescription: string;
  effectSummary: string;
}

export interface AcquisitionHistoryEntry {
  id: string;
  itemId: string;
  itemName: string;
  rarity: ItemRarity;
  quantity: number;
  source: AcquisitionSource;
  acquiredAtIso: string;
  season: number;
  week: number;
}

export interface ProgressionObjective {
  id: string;
  title: string;
  description: string;
  cadence: 'daily' | 'weekly' | 'seasonal' | 'achievement';
  targetProgress: number;
  currentProgress: number;
  completed: boolean;
  claimed: boolean;
  rewardSoftCoins: number;
  rewardPremiumCoins: number;
  rewardItemId?: string;
  rewardItemQty?: number;
}

export interface PurchaseTransactionRecord {
  transactionId: string;
  accountId: string;
  offerId: string;
  offerName: string;
  currencyType: 'soft' | 'premium' | 'real_money';
  amountPaid: number;
  priceDisplay: string;
  status: 'verified' | 'failed' | 'cancelled' | 'restored';
  verificationHash: string;
  createdAtIso: string;
  season: number;
  week: number;
  itemsGranted: { itemId: string; quantity: number }[];
  softCoinsGranted: number;
  premiumCoinsGranted: number;
}

export interface StarterPackEntitlement {
  accountId: string;
  owned: boolean;
  purchasedAtIso?: string;
  transactionId?: string;
  verificationSignature?: string;
  onboardingOfferUnlockedWeek: number;
  failedAttemptsCount: number;
  cosmeticUnlocked: boolean;
}

export interface RewardedAdState {
  dateKey: string; // YYYY-MM-DD
  adsWatchedToday: number;
  claimedNonces: string[];
  lastAdWatchedAtIso?: string;
  providerStatus: 'ready' | 'cooldown' | 'unavailable';
}

export interface BalanceConfiguration {
  version: number;
  updatedAtIso: string;
  updatedBy: string;
  // Chemistry & Synergy Match Influence Caps (Nonlinear)
  maxChemistryMatchBonusPct: number; // default 3.0 (%)
  maxSynergyMatchBonusPct: number; // default 4.0 (%)
  maxCombinedChemSynergyBonusPct: number; // default 7.0 (%)
  // Chemistry Progression
  chemistryGainPerMatchTogether: number; // default 1.25
  chemistryGainPerTrainingWeek: number; // default 0.55
  chemistryDecayPerInactiveWeek: number; // default 0.35
  transferAdaptationWeeks: number; // default 5
  // Synergy Weights
  synergyRoleWeight: number; // default 1.0
  synergyTacticsWeight: number; // default 1.0
  synergyFormationWeight: number; // default 1.0
  // Player Attribute & Training Diminishing Returns
  maxPrimaryAttributeCap: number; // default 100
  efficiencyTier40_59: number; // default 1.00 (100%)
  efficiencyTier60_69: number; // default 0.85 (85%)
  efficiencyTier70_79: number; // default 0.65 (65%)
  efficiencyTier80_89: number; // default 0.40 (40%)
  efficiencyTier90_94: number; // default 0.20 (20%)
  efficiencyTier95_99: number; // default 0.10 (10%)
  // Anti-Overbuff Booster Restrictions
  maxActiveBoostersPerPlayer: number; // default 2
  boosterGlobalStrengthMultiplier: number; // default 1.0
  boosterDefaultCooldownWeeks: number; // default 2
  // Rewarded Ads & Daily Economy
  maxRewardedAdsPerDay: number; // default 5
  dailyLoginSoftCoins: number; // default 250
  starterPackPriceUsd: number; // default 4.99
  starterPackPremiumCoins: number; // default 300
  starterPackTrainingBoostersQty: number; // default 5
  starterPackRecoveryPacksQty: number; // default 3
  starterPackMoraleBoostersQty: number; // default 2
  starterPackRareChemistryQty: number; // default 1
  starterPackRareSynergyQty: number; // default 1
  starterPackOnboardingWeeksLimit: number; // default 22
  storePurchasesEnabled: boolean; // default true
  // FC27 Tactical Counter Matrix & Physical Tuning
  tacticalStrongAdvantagePct?: number; // default 5.0 (%)
  tacticalWeakDisadvantagePct?: number; // default -5.0 (%)
  staminaDrainMultiplier?: number; // default 1.0
  fatigueAccumulationMultiplier?: number; // default 1.0
  offPositionSeverePenaltyPct?: number; // default 35.0 (%)
  offPositionAdjacentPenaltyPct?: number; // default 12.0 (%)
}

export interface AdminAuditLogEntry {
  id: string;
  timestampIso: string;
  adminUser: string;
  summary: string;
  changes: Record<string, { from: unknown; to: unknown }>;
}

export interface EconomyState {
  accountId: string;
  softCurrency: number; // Club Coins earned via matches/objectives
  premiumCurrency: number; // Pro Diamonds / Premium Coins
  inventory: InventoryItemRecord[];
  activeBoosters: ActiveBoosterInstance[];
  activePositionBoosters?: ActivePositionBooster[];
  cooldownsByTarget: Record<string, number>; // `${targetId}_${conflictGroup}` -> expiresAtTotalWeek
  usageHistory: BoosterUsageHistoryEntry[];
  acquisitionHistory: AcquisitionHistoryEntry[];
  dailyLoginStreak: number;
  lastDailyLoginClaimWeek: number; // season * 100 + week
  objectives: ProgressionObjective[];
  rewardedAds: RewardedAdState;
  starterPack: StarterPackEntitlement;
  transactions: PurchaseTransactionRecord[];
  pairChemistry: Record<string, PlayerPairChemistryRecord>;
  chemistryHistory: ChemistryHistorySnapshot[];
  balanceConfig: BalanceConfiguration;
  adminAuditLog: AdminAuditLogEntry[];
}

export interface GameState {
  saveVersion: number;
  worldSeed: number;
  careerType?: CareerType;
  currentSeason: number; // e.g. 2026
  currentWeek: number; // 1..22
  maxWeeksPerSeason: number;
  manager: ManagerProfile;
  clubs: Club[];
  players: Player[];
  fixtures: Fixture[];
  shortlistPlayerIds: string[];
  scouts: Scout[];
  scoutingReports: ScoutingReport[];
  board: BoardState;
  transfers: TransferRecord[];
  trophies: TrophyRecord[];
  seasonHistory: SeasonHistorySummary[];
  news: NewsItem[];
  economy?: EconomyState;
  clubEmpire?: ClubEmpireState;
}

export interface SaveEnvelope {
  saveVersion: number;
  slotId: 'autosave' | 'slot1' | 'slot2' | 'slot3';
  savedAtIso: string;
  managerName: string;
  clubName: string;
  seasonYear: number;
  currentWeek: number;
  state: GameState;
}


// ============================================================================
// CLUB EMPIRE — COMPLETE CLUB OWNERSHIP, INFRASTRUCTURE & DEVELOPMENT TYPES
// ============================================================================

export type ClubEmpireBuildingCategory =
  | 'stadium'
  | 'training'
  | 'medical'
  | 'commercial'
  | 'management'
  | 'community';

export type ClubEmpireBuildingId =
  // Category A: Stadium & Matchday Infrastructure (7)
  | 'football_pitch'
  | 'stadium_stands'
  | 'vip_hospitality'
  | 'parking_transport'
  | 'stadium_roof'
  | 'lighting_scoreboard'
  | 'fan_plaza'
  // Category B: Training & Player Development (4)
  | 'training_complex'
  | 'fitness_gym'
  | 'youth_academy'
  | 'youth_residence'
  // Category C: Medical & Recovery (3)
  | 'club_hospital'
  | 'rehabilitation_centre'
  | 'sports_science_lab'
  // Category D: Commercial Infrastructure (4)
  | 'club_merchandise_store'
  | 'club_museum'
  | 'media_broadcast_centre'
  | 'sponsorship_centre'
  // Category E: Management & Recruitment (2)
  | 'club_headquarters'
  | 'scouting_centre'
  // Category F: Community & Supporter Infrastructure (3)
  | 'supporters_club'
  | 'community_centre'
  | 'security_operations';

export type ClubDevelopmentTier =
  | 'Local Club'
  | 'Developing Club'
  | 'Professional Club'
  | 'Elite Club'
  | 'World-Class Club';

export type LandPlotCategory = 'standard' | 'premium';
export type LandPlotSize = 'small' | 'medium' | 'large' | 'stadium';

export interface LandPlot {
  plotId: string;
  name: string;
  category: LandPlotCategory;
  size: LandPlotSize;
  zone: ClubEmpireBuildingCategory | 'expansion';
  owned: boolean;
  purchaseCost: number;
  requiredTier: ClubDevelopmentTier;
  expansionOrder: number; // 0 = starting campus, 1..5 = expansions
  gridX: number;
  gridZ: number;
  assignedBuildingId?: ClubEmpireBuildingId;
}

export type ConstructionLifecycleState =
  | 'locked'
  | 'available'
  | 'planning'
  | 'construction'
  | 'inspection'
  | 'completed'
  | 'operational';

export type BuildingVisualStage =
  | 'Basic'
  | 'Developing'
  | 'Professional'
  | 'Elite'
  | 'World-Class';

export interface BuildingPrerequisiteRule {
  requiredBuildings?: { buildingId: ClubEmpireBuildingId; minLevel: number }[];
  minClubTier?: ClubDevelopmentTier;
  minReputation?: number;
  minOfficialTrophies?: number;
  requiresOwnedPlot?: boolean;
}

export interface BuildingLevelConfig {
  level: number;
  upgradeCost: number;
  durationMinutes: number;
  maintenanceWeekly: number;
  benefitValue: number;
  benefitLabel: string;
  prerequisites?: BuildingPrerequisiteRule;
}

export interface ClubEmpireBuildingDefinition {
  id: ClubEmpireBuildingId;
  name: string;
  category: ClubEmpireBuildingCategory;
  description: string;
  plotSizeRequired: LandPlotSize;
  maxLevel: number; // 10
  startsBuiltAtLevel1?: boolean;
  isPassiveIncomeGenerator?: boolean;
  levels: BuildingLevelConfig[];
}

export interface ClubBuildingState {
  buildingId: ClubEmpireBuildingId;
  level: number; // 0 = not yet constructed, 1..10 = operational level
  plotId?: string;
  condition: number; // 0..100
  operationalStatus: 'locked' | 'unbuilt' | 'under_construction' | 'operational';
  visualStage: BuildingVisualStage;
  totalInvested: number;
}

export interface ConstructionProject {
  projectId: string;
  careerId: string;
  buildingId: ClubEmpireBuildingId;
  plotId: string;
  previousLevel: number;
  targetLevel: number;
  startTimestampMs: number;
  expectedCompletionMs: number;
  originalDurationMs: number;
  appliedReductionMs: number;
  state: ConstructionLifecycleState;
  costPaid: number;
  adReductionsAppliedToday: number;
  completedAtMs?: number;
}

export type ConstructionBoosterGrade = 'common' | 'rare' | 'elite';

export interface ConstructionBoosterInventory {
  common: number; // 5% remaining time reduction
  rare: number;   // 10% remaining time reduction
  elite: number;  // 20% remaining time reduction
}

export interface HospitalProductionState {
  individualBoostersStored: number;
  individualStorageCap: number;
  individualLastTickMs: number;
  individualIntervalMs: number;
  teamBoostersStored: number;
  teamStorageCap: number;
  teamLastTickMs: number;
  teamIntervalMs: number;
  totalIndividualClaimed: number;
  totalTeamClaimed: number;
}

export interface TicketPricingConfig {
  generalPrice: number;
  premiumPrice: number;
  vipPrice: number;
}

export interface MatchAttendanceRecord {
  fixtureId: string;
  opponentName: string;
  week: number;
  season: number;
  stadiumCapacity: number;
  generalAttendance: number;
  premiumAttendance: number;
  vipAttendance: number;
  totalAttendance: number;
  demandFactor: number;
  grossTicketRevenue: number;
  operatingExpenses: number;
  netMatchdayRevenue: number;
  revenueEfficiencyScore: number; // 0..100
  pricingFeedback: 'Optimal' | 'Overpriced' | 'Underpriced';
}

export type SponsorshipCategory =
  | 'main_shirt'
  | 'sleeve'
  | 'training_kit'
  | 'stadium_naming'
  | 'official_equipment'
  | 'academy';

export interface SponsorshipContract {
  contractId: string;
  sponsorName: string;
  category: SponsorshipCategory;
  weeklyIncome: number;
  durationWeeks: number;
  remainingWeeks: number;
  minReputationRequired: number;
  minSponsorshipCentreLevel: number;
  performanceBonus: number;
  status: 'available' | 'active' | 'expired';
}

export type ClubEmpireMissionCadence = 'tutorial' | 'daily' | 'weekly' | 'long_term';

export interface ClubEmpireMission {
  missionId: string;
  title: string;
  description: string;
  cadence: ClubEmpireMissionCadence;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  claimed: boolean;
  rewardTreasury: number;
  rewardConstructionBoosters?: Partial<ConstructionBoosterInventory>;
  rewardReputation?: number;
}

export interface ClubEmpireTransaction {
  txId: string;
  idempotencyKey: string;
  timestampMs: number;
  category:
    | 'land_purchase'
    | 'construction_cost'
    | 'ticket_revenue'
    | 'commercial_revenue'
    | 'museum_tourism'
    | 'sponsorship'
    | 'maintenance'
    | 'mission_reward';
  amount: number; // positive = income, negative = expense
  description: string;
}

export interface ClubEmpireState {
  careerId: string;
  developmentTier: ClubDevelopmentTier;
  infrastructureScore: number; // 0..1000
  maxSimultaneousConstructions: number; // starts at 2
  landPlots: LandPlot[];
  buildings: Record<ClubEmpireBuildingId, ClubBuildingState>;
  activeConstructions: ConstructionProject[];
  constructionBoosters: ConstructionBoosterInventory;
  adReductionsUsedToday: number;
  adReductionDateKey: string;
  hospitalProduction: HospitalProductionState;
  ticketPricing: TicketPricingConfig;
  attendanceHistory: MatchAttendanceRecord[];
  sponsorships: SponsorshipContract[];
  missions: ClubEmpireMission[];
  transactions: ClubEmpireTransaction[];
  settledMatchRewardIds: string[];
  supporterLoyalty: number; // 0..100
  lastPassiveTickMs: number;
}
