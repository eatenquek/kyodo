// turns a raw score into a band + range instead of a bare percentage
// (15 self-reported answers isn't precise enough for one)

export type ScoreBandId = 'strong' | 'moderate' | 'watch';

export type ScoreBand = {
  id: ScoreBandId;
  label: string;
  hint: string; // what to do next
};

const bands: Array<{ min: number } & ScoreBand> = [
  {
    min: 72,
    id: 'strong',
    label: 'Strong',
    hint: 'Looks like a shared starting point — worth confirming it holds under deadline pressure.'
  },
  {
    min: 58,
    id: 'moderate',
    label: 'Workable',
    hint: 'Workable once the team is explicit about who owns what.'
  },
  {
    min: 0,
    id: 'watch',
    label: 'Worth discussing',
    hint: 'Preferences differ here, so it is worth agreeing an approach early.'
  }
];

export function describeScoreBand(score: number): ScoreBand {
  const band = bands.find((candidate) => score >= candidate.min) ?? bands[bands.length - 1];
  return { id: band.id, label: band.label, hint: band.hint };
}

// spread it out into a range, more honest than one number
export function scoreRange(score: number, spread = 7) {
  const low = Math.max(0, Math.round(score) - spread);
  const high = Math.min(100, Math.round(score) + spread);
  return `${low}–${high}`;
}

export const scoreCaveat =
  'These scores summarise self-reported work-style answers to start a conversation. They are not a measurement of ability, and they do not predict whether a team will succeed.';
