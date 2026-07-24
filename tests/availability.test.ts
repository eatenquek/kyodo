import { describe, expect, it } from 'vitest';
import { calculateAvailabilityOverlap } from '@/services/scoring/availability';
import { AvailabilityBlock, TeamMember } from '@/types/domain';
import { makeMember } from './fixtures';

function withAvailability(id: string, name: string, availability: AvailabilityBlock[]): TeamMember {
  return { ...makeMember(id, name), availability };
}

describe('calculateAvailabilityOverlap', () => {
  it('returns null when fewer than two people have stated availability', () => {
    expect(calculateAvailabilityOverlap([withAvailability('a', 'Ada', ['weekdayEvening'])])).toBeNull();
    expect(
      calculateAvailabilityOverlap([
        withAvailability('a', 'Ada', ['weekdayEvening']),
        makeMember('b', 'Ben')
      ])
    ).toBeNull();
  });

  it('finds slots the whole team shares', () => {
    const overlap = calculateAvailabilityOverlap([
      withAvailability('a', 'Ada', ['weekdayEvening', 'weekendMorning', 'weekdayMorning']),
      withAvailability('b', 'Ben', ['weekdayEvening', 'weekendMorning'])
    ])!;
    expect(overlap.sharedBlocks).toEqual(['weekdayMorning' as AvailabilityBlock].slice(0, 0).concat(['weekdayEvening', 'weekendMorning']));
    expect(overlap.score).toBeGreaterThanOrEqual(78);
  });

  it('scores a single shared slot lower than several', () => {
    const one = calculateAvailabilityOverlap([
      withAvailability('a', 'Ada', ['weekdayEvening']),
      withAvailability('b', 'Ben', ['weekdayEvening'])
    ])!;
    const many = calculateAvailabilityOverlap([
      withAvailability('a', 'Ada', ['weekdayEvening', 'weekendMorning', 'weekendEvening']),
      withAvailability('b', 'Ben', ['weekdayEvening', 'weekendMorning', 'weekendEvening'])
    ])!;
    expect(one.score).toBeLessThan(many.score);
    expect(one.summary).toMatch(/only slot/i);
  });

  it('scores no overlap at all as the worst case and says so plainly', () => {
    const overlap = calculateAvailabilityOverlap([
      withAvailability('a', 'Ada', ['weekdayMorning']),
      withAvailability('b', 'Ben', ['weekendEvening'])
    ])!;
    expect(overlap.sharedBlocks).toEqual([]);
    expect(overlap.score).toBeLessThan(35);
    expect(overlap.summary).toMatch(/no shared time slot/i);
  });

  it('surfaces a near miss when all but one can make a slot', () => {
    const overlap = calculateAvailabilityOverlap([
      withAvailability('a', 'Ada', ['weekdayEvening']),
      withAvailability('b', 'Ben', ['weekdayEvening']),
      withAvailability('c', 'Cara', ['weekendMorning'])
    ])!;
    expect(overlap.sharedBlocks).toEqual([]);
    expect(overlap.nearMissBlocks).toContain('weekdayEvening');
    expect(overlap.summary).toMatch(/all but one/i);
  });

  it('excludes members without availability but names them', () => {
    const overlap = calculateAvailabilityOverlap([
      withAvailability('a', 'Ada', ['weekdayEvening']),
      withAvailability('b', 'Ben', ['weekdayEvening']),
      makeMember('c', 'Cara')
    ])!;
    expect(overlap.consideredCount).toBe(2);
    expect(overlap.membersWithoutAvailability).toEqual(['Cara']);
    expect(overlap.summary).toMatch(/not added availability/i);
  });

  it('ignores duplicate blocks from a single member', () => {
    const overlap = calculateAvailabilityOverlap([
      withAvailability('a', 'Ada', ['weekdayEvening', 'weekdayEvening']),
      withAvailability('b', 'Ben', ['weekdayEvening'])
    ])!;
    expect(overlap.sharedBlocks).toEqual(['weekdayEvening']);
  });

  it('never describes a team as incompatible', () => {
    const overlap = calculateAvailabilityOverlap([
      withAvailability('a', 'Ada', ['weekdayMorning']),
      withAvailability('b', 'Ben', ['weekendEvening'])
    ])!;
    expect(overlap.summary.toLowerCase()).not.toMatch(/incompatible|impossible|doomed|bad team/);
  });
});
