import { WorkstyleScores } from '@/types/domain';

export type WorkstyleTendency = {
  id: string;
  label: string;
  description: string;
};

export type WorkstyleProfile = {
  primary: WorkstyleTendency;
  secondary: WorkstyleTendency;
  strengths: string[];
  watchOuts: string[];
  teammateNotes: string[];
};

type StyleDefinition = WorkstyleTendency & {
  eligible: (scores: WorkstyleScores) => boolean;
  affinity: (scores: WorkstyleScores) => number;
};

const mean = (...values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const styles: StyleDefinition[] = [
  {
    id: 'coordinator-minded-planner',
    label: 'Coordinator-Minded Planner',
    description: 'You may bring structure early, clarify next steps, and help the team keep moving.',
    eligible: (scores) => scores.planning >= 70 && scores.initiative >= 70 && scores.communication >= 60,
    affinity: (scores) => mean(scores.planning, scores.initiative, scores.communication)
  },
  {
    id: 'reliable-builder',
    label: 'Reliable Builder',
    description: 'You may turn plans into steady progress and place a high value on dependable follow-through.',
    eligible: (scores) => scores.pace >= 70 && scores.accountability >= 70,
    affinity: (scores) => mean(scores.pace, scores.accountability)
  },
  {
    id: 'quality-guard',
    label: 'Quality Guard',
    description: 'You may notice gaps, raise standards, and help the team protect the quality of its work.',
    eligible: (scores) => scores.detail >= 70 && scores.conflict >= 50,
    affinity: (scores) => mean(scores.detail, scores.conflict)
  },
  {
    id: 'connector',
    label: 'Connector',
    description: 'You may keep information flowing and help teammates address friction before it grows.',
    eligible: (scores) => scores.communication >= 70 && scores.conflict >= 65,
    affinity: (scores) => mean(scores.communication, scores.conflict)
  },
  {
    id: 'adaptive-explorer',
    label: 'Adaptive Explorer',
    description: 'You may handle ambiguity well and help maintain momentum when plans or scope change.',
    eligible: (scores) => scores.flexibility >= 70 && scores.initiative >= 55,
    affinity: (scores) => mean(scores.flexibility, scores.initiative)
  },
  {
    id: 'quiet-specialist',
    label: 'Quiet Specialist',
    description: 'You may add focused depth and careful thinking without needing to coordinate the whole team.',
    eligible: (scores) => scores.detail >= 60 && scores.leadership < 45 && scores.communication < 55,
    affinity: (scores) => mean(scores.detail, 100 - scores.leadership, 100 - scores.communication)
  }
];

const strengthSignals: Array<{ score: (scores: WorkstyleScores) => number; copy: string }> = [
  { score: (scores) => scores.planning, copy: 'You may help turn broad goals into visible milestones.' },
  { score: (scores) => scores.communication, copy: 'You may help keep updates and next steps clear.' },
  { score: (scores) => scores.leadership, copy: 'You may be comfortable coordinating when decisions stall.' },
  { score: (scores) => scores.pace, copy: 'You may bring a steady delivery rhythm to project work.' },
  { score: (scores) => scores.conflict, copy: 'You may surface concerns before they grow into larger problems.' },
  { score: (scores) => scores.detail, copy: 'You may catch gaps and help protect the quality bar.' },
  { score: (scores) => scores.initiative, copy: 'You may help the team start tasks and unblock momentum.' },
  { score: (scores) => scores.flexibility, copy: 'You may help the team adapt when plans or scope change.' },
  { score: (scores) => scores.accountability, copy: 'Teammates may be able to rely on your follow-through.' },
  { score: (scores) => scores.decisionComfort, copy: 'You may help the team progress when a decision is needed.' }
];

const watchOutSignals: Array<{
  score: (scores: WorkstyleScores) => number;
  high: string;
  low: string;
}> = [
  {
    score: (scores) => scores.planning,
    high: 'A strong preference for structure may make unclear starts feel more frustrating.',
    low: 'Important milestones may stay implicit unless the team names them early.'
  },
  {
    score: (scores) => scores.communication,
    high: 'Frequent updates may feel heavy to teammates who prefer more independent work.',
    low: 'Progress or concerns may stay unspoken longer than teammates expect.'
  },
  {
    score: (scores) => scores.leadership,
    high: 'You may take on too many coordination decisions when ownership is unclear.',
    low: 'The team may need to invite you explicitly into coordination or final decisions.'
  },
  {
    score: (scores) => scores.pace,
    high: 'Moving quickly can create pressure if teammates need more time to think.',
    low: 'Earlier draft deadlines may help prevent work from clustering near the end.'
  },
  {
    score: (scores) => scores.conflict,
    high: 'Direct feedback may land strongly unless the team agrees on how to raise concerns.',
    low: 'Concerns may remain quiet until they become harder to resolve.'
  },
  {
    score: (scores) => scores.detail,
    high: 'Polish can compete with speed when the team has not agreed on “good enough.”',
    low: 'A shared review checklist may help catch details before submission.'
  },
  {
    score: (scores) => scores.initiative,
    high: 'Starting quickly can get ahead of team alignment if responsibilities are still unclear.',
    low: 'Clear starting owners may help work begin without waiting for direction.'
  },
  {
    score: (scores) => scores.flexibility,
    high: 'Frequent adaptation may feel unsettled to teammates who rely on a stable plan.',
    low: 'Sudden changes may take more time to absorb, so early notice is useful.'
  }
];

function rankStyles(scores: WorkstyleScores) {
  return styles
    .map((style) => ({ style, rank: style.affinity(scores) + (style.eligible(scores) ? 1000 : 0) }))
    .sort((a, b) => b.rank - a.rank)
    .map(({ style }) => ({ id: style.id, label: style.label, description: style.description }));
}

export function buildWorkstyleProfile(scores: WorkstyleScores): WorkstyleProfile {
  const rankedStyles = rankStyles(scores);
  const strengths = strengthSignals
    .map((signal) => ({ copy: signal.copy, score: signal.score(scores) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((signal) => signal.copy);

  const watchOuts = watchOutSignals
    .map((signal) => {
      const score = signal.score(scores);
      if (score >= 75) return { copy: signal.high, distance: score - 74 };
      if (score <= 39) return { copy: signal.low, distance: 40 - score };
      return null;
    })
    .filter((signal): signal is { copy: string; distance: number } => Boolean(signal))
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 3)
    .map((signal) => signal.copy);

  if (!watchOuts.length) {
    watchOuts.push('Your preferences sit near the middle on most dimensions, so context may shape how these tendencies appear.');
  }

  const teammateNotes = [
    scores.planning >= 60
      ? 'I work best when goals, owners, and milestones are visible early.'
      : 'I am comfortable shaping the plan as work develops; clarify the few deadlines that are fixed.',
    scores.communication >= 60
      ? 'Regular, concise updates help me stay aligned with the team.'
      : 'I prefer fewer messages once responsibilities are clear; flag urgent blockers directly.',
    scores.conflict >= 60
      ? 'I tend to raise concerns directly and respond best when the conversation stays specific and calm.'
      : 'I may take time to raise disagreements, so invite me into the conversation before issues grow.'
  ];

  return {
    primary: rankedStyles[0],
    secondary: rankedStyles[1],
    strengths,
    watchOuts,
    teammateNotes
  };
}
