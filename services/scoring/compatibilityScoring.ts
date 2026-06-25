import { CompatibilityResult, Dimension, PersonalityResult, Team } from '@/types/domain';

const weights: Record<Dimension, number> = {
  planning: 18,
  communication: 18,
  pace: 16,
  conflict: 16,
  detail: 12,
  leadership: 10,
  initiative: 5,
  flexibility: 5
};

const dimensions = Object.keys(weights) as Dimension[];

export function pairCompatibility(a: PersonalityResult, b: PersonalityResult) {
  const weighted = dimensions.reduce((sum, dimension) => {
    const fit = 100 - Math.abs(a[dimension] - b[dimension]);
    return sum + fit * weights[dimension];
  }, 0);
  return Math.round(weighted / 100);
}

export function calculateTeamCompatibility(team: Team): CompatibilityResult | null {
  const completed = team.members.filter((member) => member.result);
  if (completed.length < 2) return null;

  const pairScores: number[] = [];
  for (let i = 0; i < completed.length; i += 1) {
    for (let j = i + 1; j < completed.length; j += 1) {
      pairScores.push(pairCompatibility(completed[i].result!, completed[j].result!));
    }
  }

  const score = Math.round(pairScores.reduce((sum, value) => sum + value, 0) / pairScores.length);
  const { strengths, frictions, tips } = generateInsights(completed.map((member) => member.result!));

  return {
    teamId: team.id,
    score,
    scoreLabel: scoreLabel(score),
    strengths,
    frictions,
    tips,
    createdAt: new Date().toISOString()
  };
}

function scoreLabel(score: number) {
  if (score >= 85) return 'Strong alignment';
  if (score >= 70) return 'Balanced fit';
  if (score >= 55) return 'Needs alignment';
  return 'High discussion needed';
}

function generateInsights(results: PersonalityResult[]) {
  const strengths: string[] = [];
  const frictions: string[] = [];
  const tips = new Set<string>();

  const stats = dimensions.map((dimension) => {
    const values = results.map((result) => result[dimension]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    return { dimension, min, max, average, difference: max - min };
  });

  for (const item of stats) {
    if (item.difference <= 20 && item.average >= 65) {
      const copy: Partial<Record<Dimension, string>> = {
        planning: 'Your team is likely to align well on milestones and structure.',
        communication: 'Your team has similar expectations around updates and responsiveness.',
        detail: 'Your team may share similar standards for review and polish.',
        pace: 'Your team may move at a similar working rhythm.',
        initiative: 'Your team has similar expectations around starting and unblocking work.',
        flexibility: 'Your team may adapt to project changes in similar ways.'
      };
      if (copy[item.dimension]) strengths.push(copy[item.dimension]!);
    }

    if (item.difference > 35) {
      const copy: Partial<Record<Dimension, string>> = {
        planning: 'Some members may want more structure while others prefer flexibility.',
        communication: 'The team may need to agree on how often updates should happen.',
        pace: 'Members may have different ideas of what soon means.',
        conflict: 'Some concerns may be raised directly while others may stay quiet.',
        leadership: 'The team should clarify who owns coordination and decisions.',
        initiative: 'Some members may start independently while others wait for clearer direction.',
        flexibility: 'Members may have different comfort levels when plans change.'
      };
      const tipCopy: Partial<Record<Dimension, string>> = {
        planning: 'Set one weekly milestone and one flexible working area.',
        communication: 'Agree on a default update rhythm, such as every two days.',
        pace: 'Use draft deadlines before final deadlines.',
        conflict: 'Create a simple rule: raise blockers early, discuss calmly, decide together.',
        leadership: 'Assign rotating ownership for meetings, notes, and task tracking.',
        initiative: 'Agree on who starts each task and when others should step in.',
        flexibility: 'Mark which parts of the plan are fixed and which can change.'
      };
      if (copy[item.dimension]) frictions.push(copy[item.dimension]!);
      if (tipCopy[item.dimension]) tips.add(tipCopy[item.dimension]!);
    }
  }

  if (!strengths.length) strengths.push('This team has a mix of working habits that can be useful when roles are explicit.');
  if (!frictions.length) frictions.push('Shared habits are useful, but the team should still clarify deadlines and ownership.');
  tips.add('Use a shared task board with clear owners.');
  tips.add('Set draft deadlines before final deadlines.');

  return {
    strengths: strengths.slice(0, 3),
    frictions: frictions.slice(0, 3),
    tips: Array.from(tips).slice(0, 3)
  };
}
