import { describe, expect, it } from 'vitest';
import { buildWorkstyleProfile } from '@/services/scoring/workstyleProfile';
import { makeScores } from './fixtures';

describe('buildWorkstyleProfile', () => {
  it('returns three strengths, a non-empty watch-out list, and three teammate notes', () => {
    const profile = buildWorkstyleProfile(makeScores());
    expect(profile.strengths).toHaveLength(3);
    expect(profile.watchOuts.length).toBeGreaterThan(0);
    expect(profile.teammateNotes).toHaveLength(3);
  });

  it('labels a strong planner/initiator/communicator as a Coordinator-Minded Planner', () => {
    const profile = buildWorkstyleProfile(makeScores({ planning: 82, initiative: 80, communication: 78 }));
    expect(profile.primary.label).toBe('Coordinator-Minded Planner');
  });
});
