import { Profile, Team } from '@/types/domain';

export type JourneyStepId = 'profile' | 'questionnaire' | 'team' | 'teammates' | 'insights' | 'complete';

export type JourneyStatus = {
  stepId: JourneyStepId;
  title: string;
  description: string;
  actionLabel?: string; // not set for waiting states
  completedCount: number;
  totalCount: number;
};

// profile, questionnaire, team, insights
export const journeyMilestoneCount = 4;

export function getJourneyStatus({
  profile,
  hasResult,
  answeredCount,
  totalQuestionCount = 15,
  teams,
  userId,
  teamIdsWithInsights = []
}: {
  profile: Profile | null;
  hasResult: boolean;
  answeredCount: number;
  totalQuestionCount?: number;
  teams: Team[];
  userId: string;
  teamIdsWithInsights?: string[];
}): JourneyStatus {
  const step = (
    stepId: JourneyStepId,
    completedCount: number,
    title: string,
    description: string,
    actionLabel?: string
  ): JourneyStatus => ({ stepId, title, description, actionLabel, completedCount, totalCount: journeyMilestoneCount });

  if (!profile) {
    return step('profile', 0, 'Add your profile', 'Tell your teammates who you are and the role you prefer.', 'Complete profile');
  }

  if (!hasResult) {
    const description = answeredCount
      ? `You've answered ${answeredCount} of ${totalQuestionCount} questions. Pick up where you left off.`
      : `Answer ${totalQuestionCount} short questions to build your work-style snapshot.`;
    return step(
      'questionnaire',
      1,
      answeredCount ? 'Finish the questionnaire' : 'Take the questionnaire',
      description,
      answeredCount ? 'Resume questionnaire' : 'Start questionnaire'
    );
  }

  const myTeams = teams.filter((team) => team.members.some((member) => member.id === userId));
  if (!myTeams.length) {
    return step('team', 2, 'Create or join a team', 'Start a team for your project, or join one with a code from a peer.', 'Go to teams');
  }

  const readyTeam = myTeams.find((team) => team.members.filter((member) => member.result).length >= 2);
  if (!readyTeam) {
    return step(
      'teammates',
      2,
      'Waiting on teammates',
      'Share your team join code so teammates can add their work-style profile. Insights need at least two.',
      'View join code'
    );
  }

  if (!teamIdsWithInsights.includes(readyTeam.id)) {
    return step('insights', 3, 'Generate team insights', `${readyTeam.name} has enough profiles to compare. See how your team works together.`, 'Open team');
  }

  return step('complete', journeyMilestoneCount, "You're all set", 'Revisit your team insights whenever your project or teammates change.', 'Open team');
}
