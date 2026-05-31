import { Answer, Dimension, PersonalityResult } from '@/types/domain';

const dimensions: Dimension[] = ['planning', 'communication', 'leadership', 'pace', 'conflict', 'detail', 'collaboration'];

export function normalizeAnswer(value: number, reverse: boolean) {
  const normalized = (value - 1) * 25;
  return reverse ? 100 - normalized : normalized;
}

export function scoreQuestionnaire(userId: string, answers: Answer[]): PersonalityResult {
  const scores = dimensions.reduce((acc, dimension) => {
    const dimensionAnswers = answers.filter((answer) => answer.dimension === dimension);
    const total = dimensionAnswers.reduce((sum, answer) => sum + normalizeAnswer(answer.value, answer.reverse), 0);
    acc[dimension] = dimensionAnswers.length ? Math.round(total / dimensionAnswers.length) : 50;
    return acc;
  }, {} as Record<Dimension, number>);

  const resultLabel = chooseResultLabel(scores);
  return {
    userId,
    ...scores,
    resultLabel,
    summaryText: buildSummary(resultLabel, scores),
    createdAt: new Date().toISOString()
  };
}

function chooseResultLabel(scores: Record<Dimension, number>) {
  const topTwo = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([dimension]) => dimension)
    .sort()
    .join('+');

  const labels: Record<string, string> = {
    'communication+planning': 'Structured Communicator',
    'detail+planning': 'Careful Planner',
    'communication+leadership': 'Team Organizer',
    'leadership+pace': 'Momentum Driver',
    'conflict+detail': 'Quality Challenger',
    'collaboration+communication': 'Active Collaborator',
    'collaboration+pace': 'Rapid Co-Creator'
  };

  return labels[topTwo] ?? 'Balanced Contributor';
}

function buildSummary(label: string, scores: Record<Dimension, number>) {
  const planningLine =
    scores.planning >= 70
      ? 'You tend to work best when expectations and milestones are visible early.'
      : 'You may be comfortable shaping the work as the project develops.';
  const communicationLine =
    scores.communication >= 70
      ? 'Regular updates and early questions can help you keep team momentum clear.'
      : 'You may prefer concise communication once responsibilities are understood.';

  return `${label}: ${planningLine} ${communicationLine} This is a practical work-style guide, not a fixed personality label.`;
}
