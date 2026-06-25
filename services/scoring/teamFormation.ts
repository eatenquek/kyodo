import { calculateTeamCompatibility } from '@/services/scoring/compatibilityScoring';
import { CompatibilityResult, PersonalityResult, Team, TeamMember } from '@/types/domain';

type ScoredMember = TeamMember & { result: PersonalityResult };

export type SuggestedTeamGroup = {
  id: string;
  score: number;
  scoreLabel: string;
  members: string[];
  suggestedCoordinator?: string;
  strengths: string[];
  watchOuts: string[];
};

export type TeamFormationSuggestion = {
  groupSize: number;
  groupSizes: number[];
  totalMembers: number;
  overallScore: number;
  averageTeamScore: number;
  weakestTeamScore: number;
  balanceScore: number;
  scoreLabel: string;
  evaluatedGroupings: number;
  method: 'exhaustive';
  groups: SuggestedTeamGroup[];
  createdAt: string;
};

const maxExactGroupings = 50000;

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

export function suggestBestTeamFormation(team: Team, groupSize = 3): TeamFormationSuggestion | null {
  const completed = team.members.filter((member): member is ScoredMember => Boolean(member.result));
  if (groupSize < 2 || completed.length !== team.members.length || completed.length < 4) return null;

  const groupSizes = plannedGroupSizes(completed.length, groupSize);
  if (!groupSizes.length) return null;

  const estimatedGroupings = countPartitions(groupSizes);
  if (estimatedGroupings > maxExactGroupings) return null;

  let evaluatedGroupings = 0;
  const best: { value?: EvaluatedFormation } = {};

  visitPartitions(completed, groupSizes, (groups) => {
    evaluatedGroupings += 1;
    const evaluated = evaluateFormation(team.id, groups);
    if (!best.value || isBetterFormation(evaluated, best.value)) {
      best.value = evaluated;
    }
  });

  if (!best.value) return null;

  return {
    groupSize,
    groupSizes,
    totalMembers: completed.length,
    overallScore: best.value.overallScore,
    averageTeamScore: best.value.averageTeamScore,
    weakestTeamScore: best.value.weakestTeamScore,
    balanceScore: best.value.balanceScore,
    scoreLabel: formationScoreLabel(best.value.overallScore),
    evaluatedGroupings,
    method: 'exhaustive',
    groups: best.value.groups,
    createdAt: new Date().toISOString()
  };
}

type EvaluatedFormation = {
  overallScore: number;
  averageTeamScore: number;
  weakestTeamScore: number;
  balanceScore: number;
  groups: SuggestedTeamGroup[];
};

function evaluateFormation(teamId: string, groups: ScoredMember[][]): EvaluatedFormation {
  const results = groups.map((members, index) => {
    const compatibility = calculateTeamCompatibility({
      id: `${teamId}-suggested-${index + 1}`,
      name: `Suggested team ${index + 1}`,
      joinCode: '',
      members
    });
    if (!compatibility) throw new Error('Suggested teams require at least two scored members.');
    return toSuggestedGroup(compatibility, members, index);
  });
  const scores = results.map((group) => group.score);
  const averageTeamScore = Math.round(mean(scores));
  const weakestTeamScore = Math.min(...scores);
  const balanceScore = calculateBalanceScore(scores);
  const overallScore = Math.round(averageTeamScore * 0.7 + weakestTeamScore * 0.2 + balanceScore * 0.1);

  return {
    overallScore,
    averageTeamScore,
    weakestTeamScore,
    balanceScore,
    groups: results
  };
}

function toSuggestedGroup(compatibility: CompatibilityResult, members: ScoredMember[], index: number): SuggestedTeamGroup {
  const watchOuts = [
    ...(compatibility.gaps ?? []),
    ...(compatibility.overlapRisks ?? []),
    ...compatibility.frictions
  ];

  return {
    id: `group-${index + 1}`,
    score: compatibility.score,
    scoreLabel: compatibility.scoreLabel,
    members: members.map((member) => member.name || 'Teammate'),
    suggestedCoordinator: compatibility.suggestedCoordinator,
    strengths: compatibility.strengths.slice(0, 2),
    watchOuts: [...new Set(watchOuts)].slice(0, 2)
  };
}

function calculateBalanceScore(scores: number[]) {
  const average = mean(scores);
  const variance = mean(scores.map((score) => (score - average) ** 2));
  const standardDeviation = Math.sqrt(variance);
  return clamp(Math.round(100 - standardDeviation * 2.2));
}

function isBetterFormation(candidate: EvaluatedFormation, current: EvaluatedFormation) {
  if (candidate.overallScore !== current.overallScore) return candidate.overallScore > current.overallScore;
  if (candidate.weakestTeamScore !== current.weakestTeamScore) return candidate.weakestTeamScore > current.weakestTeamScore;
  if (candidate.averageTeamScore !== current.averageTeamScore) return candidate.averageTeamScore > current.averageTeamScore;
  return candidate.balanceScore > current.balanceScore;
}

function plannedGroupSizes(memberCount: number, targetSize: number) {
  if (memberCount < 4 || targetSize < 2 || targetSize > memberCount - 2) return [];

  const fullGroups = Math.floor(memberCount / targetSize);
  const remainder = memberCount % targetSize;

  if (fullGroups < 1) return [];
  if (remainder === 0) return Array(fullGroups).fill(targetSize);
  if (remainder === 1) {
    if (fullGroups === 1) return [];
    return [targetSize + 1, ...Array(fullGroups - 1).fill(targetSize)];
  }
  return [...Array(fullGroups).fill(targetSize), remainder];
}

function visitPartitions<T>(items: T[], groupSizes: number[], onPartition: (groups: T[][]) => void) {
  function recurse(remaining: T[], remainingSizes: number[], groups: T[][]) {
    if (!remainingSizes.length) {
      onPartition(groups);
      return;
    }

    const [anchor, ...rest] = remaining;
    const distinctSizes = [...new Set(remainingSizes)];

    for (const size of distinctSizes) {
      const nextSizes = removeFirst(remainingSizes, size);
      for (const companions of combinations(rest, size - 1)) {
        const companionSet = new Set(companions);
        const group = [anchor, ...companions];
        recurse(
          rest.filter((item) => !companionSet.has(item)),
          nextSizes,
          [...groups, group]
        );
      }
    }
  }

  recurse(items, groupSizes, []);
}

function removeFirst(values: number[], target: number) {
  const next = [...values];
  next.splice(next.indexOf(target), 1);
  return next;
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [first, ...rest] = items;
  return [
    ...combinations(rest, size - 1).map((group) => [first, ...group]),
    ...combinations(rest, size)
  ];
}

function countPartitions(groupSizes: number[]) {
  const memberCount = groupSizes.reduce((sum, size) => sum + size, 0);
  const duplicateGroupSizes = groupSizes.reduce<Record<number, number>>((counts, size) => {
    counts[size] = (counts[size] ?? 0) + 1;
    return counts;
  }, {});
  const groupSizeFactor = groupSizes.reduce((product, size) => product * factorial(size), 1);
  const duplicateFactor = Object.values(duplicateGroupSizes).reduce((product, count) => product * factorial(count), 1);

  return Math.round(factorial(memberCount) / (groupSizeFactor * duplicateFactor));
}

function factorial(value: number) {
  let result = 1;
  for (let i = 2; i <= value; i += 1) result *= i;
  return result;
}

function formationScoreLabel(score: number) {
  if (score >= 85) return 'Excellent grouping';
  if (score >= 74) return 'Strong grouping';
  if (score >= 62) return 'Usable grouping';
  return 'Needs manual review';
}
