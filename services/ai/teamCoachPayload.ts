import { CompatibilityResult, Team, WorkstyleScores } from '@/types/domain';
import { TeamFormationSuggestion } from '@/services/scoring/teamFormation';

export type TeamCoachPayload = {
  version: 'kyodo-ai-coach-v1';
  refresh: boolean;
  cache: {
    targetGroupSize: number;
    formationSignature: string;
  };
  team: {
    id: string;
    name: string;
    projectName?: string;
    description?: string;
    memberCount: number;
    members: Array<{
      name: string;
      preferredRole: string;
      workstyleLabel?: string;
      summary?: string;
      scores?: WorkstyleScores;
    }>;
  };
  compatibility?: {
    score: number;
    scoreLabel: string;
    pairFitScore?: number;
    roleCoverageScore?: number;
    coordinatorHealthScore?: number;
    suggestedCoordinator?: string;
    strengths: string[];
    watchOuts: string[];
    tips: string[];
  };
  formation?: {
    targetGroupSize: number;
    actualSplit: number[];
    overallScore: number;
    averageTeamScore: number;
    weakestTeamScore: number;
    balanceScore: number;
    groups: TeamFormationSuggestion['groups'];
  };
};

export function buildTeamCoachPayload({
  team,
  compatibility,
  formation,
  targetGroupSize,
  refresh
}: {
  team: Team;
  compatibility?: CompatibilityResult;
  formation?: TeamFormationSuggestion | null;
  targetGroupSize?: number;
  refresh: boolean;
}): TeamCoachPayload {
  const resolvedTargetGroupSize =
    targetGroupSize ?? formation?.groupSize ?? Math.max(2, Math.min(3, team.members.length));

  return {
    version: 'kyodo-ai-coach-v1',
    refresh,
    cache: {
      targetGroupSize: resolvedTargetGroupSize,
      formationSignature: buildFormationSignature({ team, compatibility, formation, targetGroupSize: resolvedTargetGroupSize })
    },
    team: {
      id: team.id,
      name: team.name,
      projectName: team.projectName,
      description: team.description,
      memberCount: team.members.length,
      members: team.members.map((member) => ({
        name: member.name,
        preferredRole: member.role || 'Flexible',
        workstyleLabel: member.result?.resultLabel,
        summary: member.result?.summaryText,
        scores: member.result
          ? {
              planning: member.result.planning,
              communication: member.result.communication,
              leadership: member.result.leadership,
              pace: member.result.pace,
              conflict: member.result.conflict,
              detail: member.result.detail,
              initiative: member.result.initiative,
              flexibility: member.result.flexibility,
              accountability: member.result.accountability,
              decisionComfort: member.result.decisionComfort
            }
          : undefined
      }))
    },
    compatibility: compatibility
      ? {
          score: compatibility.score,
          scoreLabel: compatibility.scoreLabel,
          pairFitScore: compatibility.pairFitScore,
          roleCoverageScore: compatibility.roleCoverageScore,
          coordinatorHealthScore: compatibility.coordinatorHealthScore,
          suggestedCoordinator: compatibility.suggestedCoordinator,
          strengths: compatibility.strengths,
          watchOuts: [
            ...(compatibility.gaps ?? []),
            ...(compatibility.overlapRisks ?? []),
            ...compatibility.frictions
          ],
          tips: compatibility.tips
        }
      : undefined,
    formation: formation
      ? {
          targetGroupSize: resolvedTargetGroupSize,
          actualSplit: formation.groupSizes,
          overallScore: formation.overallScore,
          averageTeamScore: formation.averageTeamScore,
          weakestTeamScore: formation.weakestTeamScore,
          balanceScore: formation.balanceScore,
          groups: formation.groups
        }
      : undefined
  };
}

function buildFormationSignature({
  team,
  compatibility,
  formation,
  targetGroupSize
}: {
  team: Team;
  compatibility?: CompatibilityResult;
  formation?: TeamFormationSuggestion | null;
  targetGroupSize: number;
}) {
  const memberState = team.members
    .map((member) => ({
      id: member.id,
      resultCreatedAt: member.result?.createdAt,
      label: member.result?.resultLabel,
      scores: member.result
        ? [
            member.result.planning,
            member.result.communication,
            member.result.leadership,
            member.result.pace,
            member.result.conflict,
            member.result.detail,
            member.result.initiative,
            member.result.flexibility,
            member.result.accountability,
            member.result.decisionComfort
          ]
        : []
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const formationState = formation
    ? formation.groups
        .map((group) => ({
          score: group.score,
          members: [...group.members].sort()
        }))
        .sort((a, b) => a.members.join('|').localeCompare(b.members.join('|')))
    : [];

  return `v1_${hashString(
    JSON.stringify({
      teamId: team.id,
      targetGroupSize,
      memberState,
      compatibilityScore: compatibility?.score,
      formationScore: formation?.overallScore,
      formationState
    })
  )}`;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
