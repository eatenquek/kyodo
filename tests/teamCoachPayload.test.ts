import { describe, expect, it } from 'vitest';
import { buildTeamCoachPayload } from '@/services/ai/teamCoachPayload';
import { CompatibilityResult } from '@/types/domain';
import { makeMember, makeTeam } from './fixtures';

function baseTeam() {
  return makeTeam([makeMember('a', 'Ann', { planning: 80 }), makeMember('b', 'Ben', { pace: 80 })]);
}

describe('buildTeamCoachPayload', () => {
  it('builds a versioned payload with mapped members', () => {
    const payload = buildTeamCoachPayload({ team: baseTeam(), targetGroupSize: 2, refresh: false });
    expect(payload.version).toBe('kyodo-ai-coach-v1');
    expect(payload.team.memberCount).toBe(2);
    expect(payload.team.members.map((m) => m.name)).toEqual(['Ann', 'Ben']);
    expect(payload.cache.targetGroupSize).toBe(2);
  });

  it('concatenates compatibility watch-outs as gaps, then overlap risks, then frictions', () => {
    const compatibility = {
      teamId: 'team-1',
      score: 70,
      scoreLabel: 'Balanced team fit',
      strengths: ['s'],
      frictions: ['f'],
      tips: ['t'],
      gaps: ['g'],
      overlapRisks: ['o'],
      createdAt: '2026-01-01T00:00:00.000Z'
    } satisfies CompatibilityResult;
    const payload = buildTeamCoachPayload({ team: baseTeam(), compatibility, targetGroupSize: 2, refresh: false });
    expect(payload.compatibility?.watchOuts).toEqual(['g', 'o', 'f']);
  });

  it('produces a stable signature that changes when a member score changes', () => {
    const a = buildTeamCoachPayload({ team: baseTeam(), targetGroupSize: 2, refresh: false });
    const b = buildTeamCoachPayload({ team: baseTeam(), targetGroupSize: 2, refresh: false });
    expect(a.cache.formationSignature).toBe(b.cache.formationSignature);

    const changed = makeTeam([makeMember('a', 'Ann', { planning: 10 }), makeMember('b', 'Ben', { pace: 80 })]);
    const c = buildTeamCoachPayload({ team: changed, targetGroupSize: 2, refresh: false });
    expect(c.cache.formationSignature).not.toBe(a.cache.formationSignature);
  });
});
