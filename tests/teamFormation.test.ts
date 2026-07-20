import { describe, expect, it } from 'vitest';
import { suggestBestTeamFormation } from '@/services/scoring/teamFormation';
import { makeMember, makeTeam } from './fixtures';

function teamOf(count: number) {
  const members = Array.from({ length: count }, (_, index) =>
    makeMember(`u${index}`, `User ${index}`, { pace: 40 + (index % 5) * 10, detail: 80 - (index % 4) * 10 })
  );
  return makeTeam(members);
}

function sortedSizes(sizes: number[]) {
  return [...sizes].sort((a, b) => b - a);
}

describe('suggestBestTeamFormation', () => {
  it('splits 8 members targeting 3 into 3 / 3 / 2', () => {
    const suggestion = suggestBestTeamFormation(teamOf(8), 3);
    expect(suggestion).not.toBeNull();
    expect(sortedSizes(suggestion!.groupSizes)).toEqual([3, 3, 2]);
  });

  it('splits 10 members targeting 3 into 4 / 3 / 3', () => {
    const suggestion = suggestBestTeamFormation(teamOf(10), 3);
    expect(sortedSizes(suggestion!.groupSizes)).toEqual([4, 3, 3]);
  });

  it('splits 11 members targeting 4 into 4 / 4 / 3', () => {
    const suggestion = suggestBestTeamFormation(teamOf(11), 4);
    expect(sortedSizes(suggestion!.groupSizes)).toEqual([4, 4, 3]);
  });

  it('returns null for fewer than four members', () => {
    expect(suggestBestTeamFormation(teamOf(3), 2)).toBeNull();
  });

  it('returns null when a member has no result', () => {
    const team = makeTeam([
      makeMember('a', 'Ann'),
      makeMember('b', 'Ben'),
      makeMember('c', 'Cara'),
      { id: 'd', name: 'Dan', role: '' }
    ]);
    expect(suggestBestTeamFormation(team, 2)).toBeNull();
  });

  it('returns null when the number of groupings exceeds the exact-search safety cap', () => {
    // 14 members split into seven pairs => 14! / ((2!)^7 * 7!) = 135135 > 50000 cap.
    expect(suggestBestTeamFormation(teamOf(14), 2)).toBeNull();
  });
});
