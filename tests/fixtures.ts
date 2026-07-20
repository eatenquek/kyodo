import { questions } from '@/constants/questions';
import { Answer, PersonalityResult, Team, TeamMember, WorkstyleScores } from '@/types/domain';

export function makeScores(overrides: Partial<WorkstyleScores> = {}): WorkstyleScores {
  return {
    planning: 50,
    communication: 50,
    leadership: 50,
    pace: 50,
    conflict: 50,
    detail: 50,
    initiative: 50,
    flexibility: 50,
    accountability: 50,
    decisionComfort: 50,
    ...overrides
  };
}

export function makeMember(id: string, name: string, scoreOverrides: Partial<WorkstyleScores> = {}): TeamMember {
  const result: PersonalityResult = {
    userId: id,
    ...makeScores(scoreOverrides),
    resultLabel: 'Test Style',
    summaryText: 'Test summary.',
    createdAt: '2026-01-01T00:00:00.000Z'
  };
  return { id, name, role: '', result };
}

export function makeTeam(members: TeamMember[], overrides: Partial<Team> = {}): Team {
  return {
    id: 'team-1',
    name: 'Test Team',
    joinCode: 'TEST01',
    members,
    ...overrides
  };
}

export function allNeutralAnswers(): Answer[] {
  return questions.map((question) => ({ questionId: question.id, value: 3 }));
}
