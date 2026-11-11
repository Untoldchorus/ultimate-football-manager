export type PositionCode = 'GK' | 'RB' | 'CB' | 'LB' | 'CDM' | 'CM' | 'CAM' | 'RW' | 'LW' | 'ST';

export type FormationCode =
  | '4-3-3'
  | '4-2-3-1'
  | '4-4-2'
  | '3-5-2'
  | '3-4-3'
  | '4-1-4-1'
  | '5-3-2';

export interface PlayerAttributes {
  // Technical (8)
  passing: number;
  shooting: number;
  finishing: number;
  dribbling: number;
  crossing: number;
  tackling: number;
  firstTouch: number;
  heading: number;
  // Physical (6)
  pace: number;
  acceleration: number;
  strength: number;
  stamina: number;
  jumping: number;
  agility: number;
  // Mental (7)
  vision: number;
  positioning: number;
  decisions: number;
  composure: number;
  leadership: number;
  workRate: number;
  aggression: number;
  // Goalkeeper (3)
  reflexes: number;
  handling: number;
  distribution: number;
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

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  clubId: string;
  loanedFromClubId?: string | null;
  primaryPosition: PositionCode;
  secondaryPositions: PositionCode[];
  attributes: PlayerAttributes;
  overall: number;
  potential: number;
  contractEndSeason: number;
  weeklyWage: number;
  marketValue: number;
  fitness: number; // 0..100
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

export type AttackingStyle = 'possession' | 'wingPlay' | 'directCounter' | 'tikiTaka' | 'balanced';
export type PressingIntensity = 'low' | 'medium' | 'high' | 'gegenpress';
export type DefensiveLine = 'deep' | 'standard' | 'high';
export type TacticalMentality = 'ultraDefensive' | 'defensive' | 'balanced' | 'attacking' | 'allOutAttack';

export interface TacticsConfig {
  formation: FormationCode;
  attackingStyle: AttackingStyle;
  pressing: PressingIntensity;
  defensiveLine: DefensiveLine;
  width: number; // 1..100
  tempo: number; // 1..100
  directness: number; // 1..100
  mentality: TacticalMentality;
  counterPressing: boolean;
  offsideTrap: boolean;
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

export interface Club {
  id: string;
  name: string;
  shortName: string;
  division: 1 | 2;
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
}

export interface MatchSimulationInput {
  fixtureId: string;
  homeClub: Club;
  awayClub: Club;
  homePlayers: Player[];
  awayPlayers: Player[];
  isNeutralVenue?: boolean;
}

export type CompetitionType = 'division1' | 'division2' | 'domesticCup' | 'championsCup' | 'superCup';

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
  isLoan: boolean;
}

export type CutsceneType =
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
  playerName?: string;
  clubName?: string;
  scoreText?: string;
}

export interface ManagerProfile {
  name: string;
  nationality: string;
  tacticalStyle: AttackingStyle;
  difficulty: 'relaxed' | 'standard' | 'hardcore';
  startingChallenge: 'none' | 'financialCrisis' | 'youthOnly' | 'titleOrBust';
  clubId: string;
}

export interface NewsItem {
  id: string;
  week: number;
  season: number;
  title: string;
  body: string;
  category: 'match' | 'transfer' | 'board' | 'injury' | 'youth' | 'cup';
}

export interface GameState {
  saveVersion: number;
  worldSeed: number;
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
