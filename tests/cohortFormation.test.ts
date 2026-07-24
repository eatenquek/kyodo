import { describe, expect, it } from 'vitest';
import { planCohortFormation } from '@/services/cohorts/cohortFormation';
import { AvailabilityBlock, CohortMember } from '@/types/domain';
import { makeMember } from './fixtures';

const cohort = { id: 'cohort-1', name: 'CS3216 Tutorial 4' };

function student(id: string, name: string, overrides = {}, availability?: AvailabilityBlock[]): CohortMember {
  return { ...makeMember(id, name, overrides), availability };
}

function readyRoster(count: number): CohortMember[] {
  return Array.from({ length: count }, (_, index) =>
    student(`s${index}`, `Student ${index}`, {
      planning: 30 + index * 7,
      communication: 80 - index * 5,
      leadership: 40 + index * 6
    })
  );
}

describe('planCohortFormation', () => {
  it('blocks with fewer than four ready profiles and says how many are ready', () => {
    const roster = [...readyRoster(3), student('p', 'Pending')];
    roster[3].result = undefined;

    const outcome = planCohortFormation(cohort, roster, 2);
    expect(outcome.status).toBe('blocked');
    if (outcome.status !== 'blocked') throw new Error('expected blocked');
    expect(outcome.reason).toMatch(/at least 4/i);
    expect(outcome.readyCount).toBe(3);
    expect(outcome.pendingNames).toEqual(['Pending']);
  });

  it('blocks when the target size leaves room for only one group', () => {
    const outcome = planCohortFormation(cohort, readyRoster(6), 5);
    expect(outcome.status).toBe('blocked');
    if (outcome.status !== 'blocked') throw new Error('expected blocked');
    expect(outcome.reason).toMatch(/smaller target size/i);
  });

  it('splits a ready cohort into groups covering everyone exactly once', () => {
    const roster = readyRoster(9);
    const outcome = planCohortFormation(cohort, roster, 3);
    expect(outcome.status).toBe('ok');
    if (outcome.status !== 'ok') throw new Error('expected ok');

    const assigned = outcome.result.groups.flatMap((group) => group.members);
    expect(assigned.length).toBe(9);
    expect(new Set(assigned).size).toBe(9);
    expect(outcome.result.groupSizes.reduce((a, b) => a + b, 0)).toBe(9);
  });

  it('excludes students without a result but names them', () => {
    const roster = [...readyRoster(8), student('late', 'Late Student')];
    roster[8].result = undefined;

    const outcome = planCohortFormation(cohort, roster, 4);
    expect(outcome.status).toBe('ok');
    if (outcome.status !== 'ok') throw new Error('expected ok');
    expect(outcome.result.readyCount).toBe(8);
    expect(outcome.result.pendingNames).toEqual(['Late Student']);
    expect(outcome.result.groups.flatMap((g) => g.members)).not.toContain('Late Student');
  });

  it('reports shared availability per suggested group', () => {
    const roster = readyRoster(8).map((member, index) => ({
      ...member,
      availability: (index % 2 === 0 ? ['weekdayEvening'] : ['weekendMorning']) as AvailabilityBlock[]
    }));

    const outcome = planCohortFormation(cohort, roster, 4);
    expect(outcome.status).toBe('ok');
    if (outcome.status !== 'ok') throw new Error('expected ok');

    for (const group of outcome.result.groups) {
      expect(typeof group.availabilityNote).toBe('string');
      expect(group.availabilityNote.length).toBeGreaterThan(0);
    }
  });

  it('refuses a cohort too large for exact search instead of guessing', () => {
    const outcome = planCohortFormation(cohort, readyRoster(24), 2);
    expect(outcome.status).toBe('blocked');
    if (outcome.status !== 'blocked') throw new Error('expected blocked');
    expect(outcome.reason).toMatch(/too large|smaller pools/i);
  });
});
