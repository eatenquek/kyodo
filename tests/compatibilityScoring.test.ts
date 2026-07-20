import { describe, expect, it } from 'vitest';
import { calculateTeamCompatibility, pairCompatibility } from '@/services/scoring/compatibilityScoring';
import { makeMember, makeTeam } from './fixtures';

describe('pairCompatibility', () => {
  it('returns a score within 0-100 for two members', () => {
    const a = makeMember('a', 'Ann').result!;
    const b = makeMember('b', 'Ben', { pace: 80, detail: 80 }).result!;
    const score = pairCompatibility(a, b);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('calculateTeamCompatibility', () => {
  it('returns null for a team with fewer than two scored members', () => {
    const team = makeTeam([makeMember('a', 'Ann')]);
    expect(calculateTeamCompatibility(team)).toBeNull();
  });

  it('produces a bounded score and four role-coverage entries for a valid team', () => {
    const team = makeTeam([
      makeMember('a', 'Ann', { planning: 80, communication: 75 }),
      makeMember('b', 'Ben', { pace: 80, accountability: 78 }),
      makeMember('c', 'Cara', { detail: 82, conflict: 60 })
    ]);
    const result = calculateTeamCompatibility(team);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(0);
    expect(result!.score).toBeLessThanOrEqual(100);
    expect(result!.roleCoverage).toHaveLength(4);
    expect(result!.strengths.length).toBeGreaterThan(0);
  });

  it('is deterministic for identical input', () => {
    const build = () =>
      makeTeam([
        makeMember('a', 'Ann', { planning: 80 }),
        makeMember('b', 'Ben', { pace: 80 })
      ]);
    expect(calculateTeamCompatibility(build())!.score).toBe(calculateTeamCompatibility(build())!.score);
  });
});
