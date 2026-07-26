import { calculateAvailabilityOverlap } from '@/services/scoring/availability';
import { suggestBestTeamFormation, SuggestedTeamGroup } from '@/services/scoring/teamFormation';
import { Cohort, CohortMember, Team, TeamMember } from '@/types/domain';

// runs the existing group-split optimiser across a whole cohort, adding
// per-group shared availability on top

export type CohortGroup = SuggestedTeamGroup & {
  sharedAvailability: string[]; // slots every member of this group can make
  availabilityNote: string;
};

export type CohortFormationResult = {
  groups: CohortGroup[];
  groupSizes: number[];
  overallScore: number;
  scoreLabel: string;
  averageTeamScore: number;
  weakestTeamScore: number;
  balanceScore: number;
  evaluatedGroupings: number;
  readyCount: number;
  pendingNames: string[];
};

export type CohortFormationOutcome =
  | { status: 'ok'; result: CohortFormationResult }
  | { status: 'blocked'; reason: string; readyCount: number; pendingNames: string[] };

export function planCohortFormation(
  cohort: Pick<Cohort, 'id' | 'name'>,
  members: CohortMember[],
  targetGroupSize: number,
  organiserId?: string
): CohortFormationOutcome {
  // the organiser runs the split, they aren't placed into a team
  const students = organiserId ? members.filter((member) => member.id !== organiserId) : members;
  const ready = students.filter((member) => Boolean(member.result));
  const pendingNames = students.filter((member) => !member.result).map((member) => member.name || 'Student');

  if (ready.length < 4) {
    return {
      status: 'blocked',
      reason: `Need at least 4 completed work-style profiles to suggest groups. ${ready.length} of ${students.length} are ready.`,
      readyCount: ready.length,
      pendingNames
    };
  }

  if (targetGroupSize < 2) {
    return { status: 'blocked', reason: 'Choose a target group size of 2 or more.', readyCount: ready.length, pendingNames };
  }

  if (targetGroupSize > ready.length - 2) {
    return {
      status: 'blocked',
      reason: 'Choose a smaller target size so there is room for at least two groups.',
      readyCount: ready.length,
      pendingNames
    };
  }

  // optimiser needs everyone to have a result, so only pass ready students
  const pseudoTeam: Team = {
    id: cohort.id,
    name: cohort.name,
    joinCode: '',
    members: ready as TeamMember[]
  };

  const suggestion = suggestBestTeamFormation(pseudoTeam, targetGroupSize);
  if (!suggestion) {
    return {
      status: 'blocked',
      reason: 'This cohort is too large to split exactly on-device. Split it into smaller pools first.',
      readyCount: ready.length,
      pendingNames
    };
  }

  const byName = new Map(ready.map((member) => [member.name, member]));

  const groups: CohortGroup[] = suggestion.groups.map((group) => {
    const groupMembers = group.members
      .map((name) => byName.get(name))
      .filter((member): member is CohortMember => Boolean(member));
    const overlap = calculateAvailabilityOverlap(groupMembers);

    return {
      ...group,
      sharedAvailability: overlap?.sharedLabels ?? [],
      availabilityNote: overlap ? overlap.summary : 'Availability not stated by enough members of this group yet.'
    };
  });

  return {
    status: 'ok',
    result: {
      groups,
      groupSizes: suggestion.groupSizes,
      overallScore: suggestion.overallScore,
      scoreLabel: suggestion.scoreLabel,
      averageTeamScore: suggestion.averageTeamScore,
      weakestTeamScore: suggestion.weakestTeamScore,
      balanceScore: suggestion.balanceScore,
      evaluatedGroupings: suggestion.evaluatedGroupings,
      readyCount: ready.length,
      pendingNames
    }
  };
}
