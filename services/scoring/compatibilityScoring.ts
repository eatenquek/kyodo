import {
  CompatibilityResult,
  CompatibilityRoleCoverage,
  PersonalityResult,
  Team,
  TeamMember,
  WorkstyleScores
} from '@/types/domain';

type ScoredMember = TeamMember & { result: PersonalityResult };
type RoleId = CompatibilityRoleCoverage['id'];

const scoreDimensions: Array<{ key: keyof WorkstyleScores; weight: number }> = [
  { key: 'communication', weight: 16 },
  { key: 'planning', weight: 14 },
  { key: 'pace', weight: 12 },
  { key: 'conflict', weight: 12 },
  { key: 'detail', weight: 10 },
  { key: 'leadership', weight: 8 },
  { key: 'initiative', weight: 8 },
  { key: 'flexibility', weight: 8 },
  { key: 'accountability', weight: 6 },
  { key: 'decisionComfort', weight: 6 }
];

const roleDefinitions: Array<{
  id: RoleId;
  label: string;
  responsibility: string;
  gap: string;
  score: (result: WorkstyleScores) => number;
}> = [
  {
    id: 'coordinator',
    label: 'Coordinator',
    responsibility: 'Make one person responsible for meeting notes, next steps, and decision follow-through.',
    gap: 'No clear coordination anchor yet.',
    score: (result) => mean(result.planning, result.communication, result.leadership, result.decisionComfort)
  },
  {
    id: 'builder',
    label: 'Builder',
    responsibility: 'Name task owners who can turn the plan into visible weekly progress.',
    gap: 'Execution ownership may need to be made more explicit.',
    score: (result) => mean(result.pace, result.accountability, result.initiative)
  },
  {
    id: 'quality',
    label: 'Quality guard',
    responsibility: 'Assign a reviewer to check gaps, edge cases, and final polish before submission.',
    gap: 'Quality review could be under-covered unless someone owns it.',
    score: (result) => mean(result.detail, result.conflict)
  },
  {
    id: 'connector',
    label: 'Connector',
    responsibility: 'Set a lightweight check-in rhythm so blockers and changes surface early.',
    gap: 'Communication and adaptation may need a clearer rhythm.',
    score: (result) => mean(result.communication, result.conflict, result.flexibility)
  }
];

const roleIds = roleDefinitions.map((role) => role.id);

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const mean = (...values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

function workstyleFit(a: WorkstyleScores, b: WorkstyleScores) {
  const weighted = scoreDimensions.reduce((sum, dimension) => {
    const fit = 100 - Math.abs(a[dimension.key] - b[dimension.key]);
    return sum + fit * dimension.weight;
  }, 0);
  return Math.round(weighted / 100);
}

function roleSignals(result: WorkstyleScores): Record<RoleId, number> {
  return Object.fromEntries(roleDefinitions.map((role) => [role.id, Math.round(role.score(result))])) as Record<RoleId, number>;
}

function strongestRole(result: WorkstyleScores) {
  const signals = roleSignals(result);
  return [...roleIds].sort((a, b) => signals[b] - signals[a])[0];
}

function pairComplementarity(a: WorkstyleScores, b: WorkstyleScores) {
  const aSignals = roleSignals(a);
  const bSignals = roleSignals(b);
  const coverage = mean(...roleIds.map((role) => Math.max(aSignals[role], bSignals[role])));
  const differentStrengthsBonus = strongestRole(a) !== strongestRole(b) ? 12 : 4;
  const coordinatorSpread = Math.abs(aSignals.coordinator - bSignals.coordinator);
  const coordinationBalanceBonus = coordinatorSpread >= 12 && coordinatorSpread <= 45 ? 6 : 0;
  const overlapPenalty = roleIds.some((role) => aSignals[role] >= 75 && bSignals[role] >= 75) ? 4 : 0;

  return clamp(Math.round(coverage * 0.82 + differentStrengthsBonus + coordinationBalanceBonus - overlapPenalty));
}

export function pairCompatibility(a: PersonalityResult, b: PersonalityResult) {
  const fitScore = workstyleFit(a, b);
  const complementarityScore = pairComplementarity(a, b);
  return Math.round(fitScore * 0.7 + complementarityScore * 0.3);
}

export function calculateTeamCompatibility(team: Team): CompatibilityResult | null {
  const completed = team.members.filter((member): member is ScoredMember => Boolean(member.result));
  if (completed.length < 2) return null;

  const pairScores: number[] = [];
  for (let i = 0; i < completed.length; i += 1) {
    for (let j = i + 1; j < completed.length; j += 1) {
      pairScores.push(pairCompatibility(completed[i].result, completed[j].result));
    }
  }

  const pairFitScore = Math.round(pairScores.reduce((sum, value) => sum + value, 0) / pairScores.length);
  const roleCoverage = calculateRoleCoverage(completed);
  const roleCoverageScore = Math.round(mean(...roleCoverage.map((role) => role.score)));
  const coordinatorHealthScore = calculateCoordinatorHealth(completed);
  const score = Math.round(pairFitScore * 0.6 + roleCoverageScore * 0.25 + coordinatorHealthScore * 0.15);
  const suggestedCoordinator = suggestCoordinator(completed);
  const sharedResponsibilities = buildSharedResponsibilities(roleCoverage);
  const gaps = buildGaps(roleCoverage, coordinatorHealthScore);
  const overlapRisks = buildOverlapRisks(completed);
  const { strengths, frictions, tips } = generateInsights({
    results: completed.map((member) => member.result),
    pairFitScore,
    roleCoverage,
    roleCoverageScore,
    coordinatorHealthScore,
    suggestedCoordinator,
    sharedResponsibilities,
    gaps,
    overlapRisks
  });

  return {
    teamId: team.id,
    score,
    scoreLabel: scoreLabel(score),
    pairFitScore,
    roleCoverageScore,
    coordinatorHealthScore,
    suggestedCoordinator,
    roleCoverage,
    sharedResponsibilities,
    overlapRisks,
    gaps,
    strengths,
    frictions,
    tips,
    createdAt: new Date().toISOString()
  };
}

function calculateRoleCoverage(members: ScoredMember[]): CompatibilityRoleCoverage[] {
  return roleDefinitions.map((role) => {
    const ranked = members
      .map((member) => ({
        name: member.name || 'Teammate',
        score: Math.round(role.score(member.result))
      }))
      .sort((a, b) => b.score - a.score);
    const [first, second] = ranked;
    const score = Math.round(first.score * 0.78 + (second?.score ?? first.score) * 0.22);
    const namedMembers = ranked.filter((member) => member.score >= 65).map((member) => member.name);

    return {
      id: role.id,
      label: role.label,
      score: clamp(score),
      members: namedMembers.length ? namedMembers.slice(0, 3) : [first.name]
    };
  });
}

function calculateCoordinatorHealth(members: ScoredMember[]) {
  const coordinatorScores = members
    .map((member) => Math.round(roleDefinitions[0].score(member.result)))
    .sort((a, b) => b - a);
  const top = coordinatorScores[0];
  const second = coordinatorScores[1] ?? top;
  const highCoordinatorCount = coordinatorScores.filter((score) => score >= 70).length;
  const averageCommunication = mean(...members.map((member) => member.result.communication));
  const averageDecisionComfort = mean(...members.map((member) => member.result.decisionComfort));
  const overlapPenalty = highCoordinatorCount >= 3 ? 16 : highCoordinatorCount === 2 ? 6 : 0;
  const missingAnchorPenalty = top < 58 ? 14 : 0;

  return clamp(
    Math.round(
      top * 0.48 +
        second * 0.16 +
        averageCommunication * 0.2 +
        averageDecisionComfort * 0.16 -
        overlapPenalty -
        missingAnchorPenalty
    )
  );
}

function suggestCoordinator(members: ScoredMember[]) {
  const ranked = members
    .map((member) => ({
      name: member.name || 'Teammate',
      score: Math.round(roleDefinitions[0].score(member.result))
    }))
    .sort((a, b) => b.score - a.score);
  const [first, second] = ranked;

  if (first.score >= 68) return `${first.name} is the strongest fit to coordinate first.`;
  if (first.score >= 58 && second) return `Let ${first.name} coordinate kickoff, then rotate with ${second.name}.`;
  return 'Use a rotating coordinator until someone clearly owns planning and decisions.';
}

function buildSharedResponsibilities(roleCoverage: CompatibilityRoleCoverage[]) {
  return roleCoverage.map((role) => {
    const definition = roleDefinitions.find((item) => item.id === role.id)!;
    const owners = role.members.join(', ');
    return `${role.label}: ${owners}. ${definition.responsibility}`;
  });
}

function buildGaps(roleCoverage: CompatibilityRoleCoverage[], coordinatorHealthScore: number) {
  const gaps = roleCoverage
    .filter((role) => role.score < 62)
    .map((role) => {
      const definition = roleDefinitions.find((item) => item.id === role.id)!;
      return `${definition.gap} ${definition.responsibility}`;
    });

  if (coordinatorHealthScore < 62) {
    gaps.unshift('Coordination may need an explicit owner for deadlines, meeting notes, and final decisions.');
  }

  return [...new Set(gaps)].slice(0, 4);
}

function buildOverlapRisks(members: ScoredMember[]) {
  const risks: string[] = [];
  const coordinatorCount = members.filter((member) => roleDefinitions[0].score(member.result) >= 70).length;
  const fastPaceCount = members.filter((member) => member.result.pace >= 75).length;
  const detailCount = members.filter((member) => member.result.detail >= 75).length;
  const quietConflictCount = members.filter((member) => member.result.conflict <= 40).length;

  if (coordinatorCount >= 3) risks.push('Several members may try to coordinate; agree who makes the final call for each phase.');
  if (fastPaceCount >= 2 && detailCount >= 2) risks.push('Speed and polish are both strong; define "good enough" before deadlines get close.');
  if (quietConflictCount >= 2) risks.push('Concerns may stay quiet; schedule a short risk check before major decisions.');

  return risks.slice(0, 3);
}

function scoreLabel(score: number) {
  if (score >= 85) return 'Strong team fit';
  if (score >= 72) return 'Balanced team fit';
  if (score >= 58) return 'Promising with role clarity';
  return 'Needs alignment';
}

function generateInsights({
  results,
  pairFitScore,
  roleCoverage,
  roleCoverageScore,
  coordinatorHealthScore,
  suggestedCoordinator,
  sharedResponsibilities,
  gaps,
  overlapRisks
}: {
  results: PersonalityResult[];
  pairFitScore: number;
  roleCoverage: CompatibilityRoleCoverage[];
  roleCoverageScore: number;
  coordinatorHealthScore: number;
  suggestedCoordinator: string;
  sharedResponsibilities: string[];
  gaps: string[];
  overlapRisks: string[];
}) {
  const strengths = new Set<string>();
  const frictions = new Set<string>();
  const tips = new Set<string>();

  if (pairFitScore >= 74) strengths.add("The team's day-to-day work preferences look compatible overall.");
  if (roleCoverageScore >= 72) strengths.add('Core team roles are covered by at least one strong member.');
  if (coordinatorHealthScore >= 72) strengths.add('Coordination has a clear anchor, which should help decisions move.');

  roleCoverage
    .filter((role) => role.score >= 72)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .forEach((role) => strengths.add(`${role.label} coverage is strong through ${role.members.join(', ')}.`));

  const dimensionSpreads = scoreDimensions
    .map((dimension) => {
      const values = results.map((result) => result[dimension.key]);
      return {
        key: dimension.key,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    })
    .filter((item) => item.max - item.min >= 40);

  const spreadCopy: Partial<Record<keyof WorkstyleScores, string>> = {
    planning: 'Some members may want more structure while others prefer shaping the plan as they go.',
    communication: 'The team should agree how often updates happen so no one feels chased or left out.',
    pace: 'Members may have different ideas of what "soon" means.',
    conflict: 'Some concerns may be raised directly while others may stay quiet.',
    detail: 'The team may need to agree how much polish is enough.',
    flexibility: 'Plan changes may feel easy to some teammates and disruptive to others.'
  };

  dimensionSpreads.forEach((item) => {
    const copy = spreadCopy[item.key];
    if (copy) frictions.add(copy);
  });
  gaps.forEach((gap) => frictions.add(gap));
  overlapRisks.forEach((risk) => frictions.add(risk));

  tips.add(suggestedCoordinator);
  sharedResponsibilities.slice(0, 2).forEach((responsibility) => tips.add(responsibility));
  if (gaps.length) tips.add('Run a 10-minute role check: owner, reviewer, coordinator, and backup for the next milestone.');
  tips.add('Set draft deadlines before final deadlines so the team can adjust without panic.');

  if (!strengths.size) strengths.add('This team has a workable mix of habits, especially if responsibilities are explicit.');
  if (!frictions.size) frictions.add('Shared habits are useful, but the team should still clarify deadlines and ownership.');

  return {
    strengths: Array.from(strengths).slice(0, 4),
    frictions: Array.from(frictions).slice(0, 4),
    tips: Array.from(tips).slice(0, 4)
  };
}
