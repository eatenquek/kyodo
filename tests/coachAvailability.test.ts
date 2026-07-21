import { describe, expect, it } from 'vitest';
import { getCoachAvailability } from '@/services/ai/coachAvailability';

describe('getCoachAvailability', () => {
  it('blocks generation with fewer than two completed profiles', () => {
    const result = getCoachAvailability({ memberCount: 3, completedResultCount: 1, hasCompatibility: false, hasFormation: false });
    expect(result.canGenerate).toBe(false);
    expect(result.reason).toMatch(/at least 2/i);
  });

  it('blocks generation when no compatibility or formation is available yet', () => {
    const result = getCoachAvailability({ memberCount: 2, completedResultCount: 2, hasCompatibility: false, hasFormation: false });
    expect(result.canGenerate).toBe(false);
    expect(result.reason).toMatch(/compatibility/i);
  });

  it('allows generation and notes partial data when some members are unfinished', () => {
    const result = getCoachAvailability({ memberCount: 4, completedResultCount: 3, hasCompatibility: true, hasFormation: false });
    expect(result.canGenerate).toBe(true);
    expect(result.reason).toMatch(/haven.?t finished/i);
  });

  it('allows generation with no note when everyone is ready', () => {
    const result = getCoachAvailability({ memberCount: 3, completedResultCount: 3, hasCompatibility: true, hasFormation: true });
    expect(result.canGenerate).toBe(true);
    expect(result.reason).toBe('');
  });

  it('allows generation from formation alone when everyone is ready and compatibility is absent', () => {
    const result = getCoachAvailability({ memberCount: 4, completedResultCount: 4, hasCompatibility: false, hasFormation: true });
    expect(result.canGenerate).toBe(true);
    expect(result.reason).toBe('');
  });
});
