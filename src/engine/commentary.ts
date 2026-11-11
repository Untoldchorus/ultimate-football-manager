import { SeededRng } from './rng';
import { MatchEventType } from './types';

const TEMPLATES: Record<MatchEventType, string[]> = {
  kickoff: [
    'The referee blows the whistle and {club} get the match underway!',
    'We are underway! {club} kick off.',
  ],
  pass: [
    '{player} circulates possession neatly to {secondary} in midfield.',
    'Crisp pass from {player} finding {secondary} in space.',
    '{player} keeps the ball moving for {club}, linking up with {secondary}.',
  ],
  throughBall: [
    'Brilliant vision from {player}! Slices the defense open with a through ball to {secondary}!',
    '{player} threads an incisive pass between the lines for {secondary}!',
  ],
  cross: [
    '{player} whips a dangerous cross into the penalty area towards {secondary}!',
    '{player} gets down the flank and delivers an inviting ball into the box.',
  ],
  shot: [
    '{player} unleashes a strike from the edge of the box — just wide of the upright!',
    'Chance for {club}! {player} fires an effort that whistles over the crossbar.',
    '{player} finds half a yard and pulls the trigger, but it drifts off target.',
  ],
  save: [
    'Denied! {player} strikes it cleanly on target, but {secondary} produces a sharp save!',
    'What a stop by {secondary} to palm away a fierce effort from {player}!',
    '{player} tests the keeper, and {secondary} holds on securely.',
  ],
  goal: [
    'GOAL! {player} buries it into the back of the net for {club}! Clinical finish!',
    'GOAL! Unstoppable strike from {player}! The {club} supporters erupt!',
    'GOAL! {player} slots it past the goalkeeper with ice-cold composure for {club}!',
  ],
  tackle: [
    'Strong, well-timed sliding tackle by {player} to win the ball back for {club}.',
    '{player} steps in decisively and dispossesses {secondary}.',
  ],
  interception: [
    '{player} reads the play superbly and intercepts the pass for {club}.',
    'Smart anticipation by {player} to cut out the danger.',
  ],
  foul: [
    'The referee halts play after a late challenge by {player} on {secondary}.',
    'Free kick awarded against {club} as {player} brings down {secondary}.',
  ],
  yellowCard: [
    'YELLOW CARD! {player} ({club}) goes into the referee’s book for a reckless challenge.',
    'Booking for {player} ({club}) after pulling back {secondary} on the break.',
  ],
  redCard: [
    'RED CARD! {player} ({club}) is sent off! A huge moment in this match!',
    'Marching orders for {player}! {club} are reduced to ten men!',
  ],
  corner: [
    'Corner kick awarded to {club}. {player} steps up to take it.',
    '{club} win a corner as the ball is deflected behind.',
  ],
  freeKick: [
    'Dangerous free-kick opportunity for {club} in attacking territory.',
    '{player} stands over the set piece for {club}.',
  ],
  penalty: [
    'PENALTY TO {club}! Foul inside the box and the referee points straight to the spot!',
    'Spot kick awarded to {club}! {player} will step up from 12 yards.',
  ],
  injury: [
    'Concern for {club} as {player} stays down on the turf receiving treatment.',
    '{player} has picked up a knock and signals to the {club} bench.',
  ],
  substitution: [
    'Tactical change for {club}: {player} comes on to replace {secondary}.',
    'Fresh legs for {club} as {player} enters the pitch for {secondary}.',
  ],
  halfTime: [
    'The referee brings an absorbing first half to a close.',
    'Half-time whistle! Both sides head down the tunnel.',
  ],
  fullTime: [
    'Full-time whistle! The match comes to an end.',
    'That is full time! The referee blows the final whistle.',
  ],
};

export function formatCommentary(
  rng: SeededRng,
  type: MatchEventType,
  clubName: string,
  playerName?: string,
  secondaryName?: string
): string {
  const pool = TEMPLATES[type] ?? ['Play continues on the pitch.'];
  const template = rng.pick(pool);
  return template
    .replace(/\{club\}/g, clubName)
    .replace(/\{player\}/g, playerName ?? 'A player')
    .replace(/\{secondary\}/g, secondaryName ?? 'a teammate');
}
