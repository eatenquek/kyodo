import { describe, expect, it } from 'vitest';
import { resolveActiveTeam } from '@/services/teams/activeTeam';
import { makeMember, makeTeam } from './fixtures';

const alex = makeMember('user-alex', 'Alex');
const bea = makeMember('user-bea', 'Bea');
const cass = makeMember('user-cass', 'Cass');

const teamOne = makeTeam([alex, bea], { id: 'team-1', name: 'Team One' });
const teamTwo = makeTeam([alex, cass], { id: 'team-2', name: 'Team Two' });
const strangersTeam = makeTeam([bea, cass], { id: 'team-3', name: 'Strangers' });

describe('resolveActiveTeam', () => {
  it('returns the selected team when the user is a member of it', () => {
    const team = resolveActiveTeam([teamOne, teamTwo], 'team-2', 'user-alex');
    expect(team?.id).toBe('team-2');
  });

  it('falls back to the first team the user belongs to when nothing is selected', () => {
    const team = resolveActiveTeam([teamOne, teamTwo], undefined, 'user-alex');
    expect(team?.id).toBe('team-1');
  });

  it('ignores a selected team the user is not a member of', () => {
    const team = resolveActiveTeam([strangersTeam, teamTwo], 'team-3', 'user-alex');
    expect(team?.id).toBe('team-2');
  });

  it('ignores a selected team id that no longer exists', () => {
    const team = resolveActiveTeam([teamOne], 'team-deleted', 'user-alex');
    expect(team?.id).toBe('team-1');
  });

  it('returns undefined when the user belongs to no teams', () => {
    expect(resolveActiveTeam([strangersTeam], 'team-3', 'user-alex')).toBeUndefined();
  });

  it('returns undefined when there are no teams at all', () => {
    expect(resolveActiveTeam([], undefined, 'user-alex')).toBeUndefined();
  });
});
