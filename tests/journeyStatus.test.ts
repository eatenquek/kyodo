import { describe, expect, it } from 'vitest';
import { getJourneyStatus, journeyMilestoneCount } from '@/services/onboarding/journeyStatus';
import { makeMember, makeTeam } from './fixtures';

const you = makeMember('user-you', 'You');
const teammate = makeMember('user-mate', 'Mate');
const pendingTeammate = { id: 'user-pending', name: 'Pending', role: '' };

const profile = {
  id: 'user-you',
  fullName: 'You',
  preferredRole: 'Builder',
  onboardingCompleted: true
};

describe('getJourneyStatus', () => {
  it('asks for a profile first', () => {
    const status = getJourneyStatus({ profile: null, hasResult: false, answeredCount: 0, teams: [], userId: 'user-you' });
    expect(status.stepId).toBe('profile');
    expect(status.completedCount).toBe(0);
  });

  it('asks for the questionnaire once the profile exists', () => {
    const status = getJourneyStatus({ profile, hasResult: false, answeredCount: 0, teams: [], userId: 'user-you' });
    expect(status.stepId).toBe('questionnaire');
    expect(status.completedCount).toBe(1);
  });

  it('reports questionnaire progress when partially answered', () => {
    const status = getJourneyStatus({ profile, hasResult: false, answeredCount: 7, teams: [], userId: 'user-you' });
    expect(status.stepId).toBe('questionnaire');
    expect(status.description).toContain('7');
  });

  it('asks the user to create or join a team once the result exists', () => {
    const status = getJourneyStatus({ profile, hasResult: true, answeredCount: 15, teams: [], userId: 'user-you' });
    expect(status.stepId).toBe('team');
    expect(status.completedCount).toBe(2);
  });

  it('waits on teammates when the team has only one completed profile', () => {
    const team = makeTeam([you, pendingTeammate]);
    const status = getJourneyStatus({ profile, hasResult: true, answeredCount: 15, teams: [team], userId: 'user-you' });
    expect(status.stepId).toBe('teammates');
    expect(status.description).toMatch(/join code|share/i);
  });

  it('prompts for insights when two profiles are ready', () => {
    const team = makeTeam([you, teammate]);
    const status = getJourneyStatus({ profile, hasResult: true, answeredCount: 15, teams: [team], userId: 'user-you' });
    expect(status.stepId).toBe('insights');
    expect(status.completedCount).toBe(3);
  });

  it('reports completion once insights exist for a ready team', () => {
    const team = makeTeam([you, teammate]);
    const status = getJourneyStatus({
      profile,
      hasResult: true,
      answeredCount: 15,
      teams: [team],
      userId: 'user-you',
      teamIdsWithInsights: ['team-1']
    });
    expect(status.stepId).toBe('complete');
    expect(status.completedCount).toBe(journeyMilestoneCount);
  });

  it('ignores teams the user does not belong to', () => {
    const strangers = makeTeam([teammate], { id: 'team-other' });
    const status = getJourneyStatus({ profile, hasResult: true, answeredCount: 15, teams: [strangers], userId: 'user-you' });
    expect(status.stepId).toBe('team');
  });
});
