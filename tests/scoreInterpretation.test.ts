import { describe, expect, it } from 'vitest';
import { describeScoreBand, scoreCaveat, scoreRange } from '@/services/scoring/scoreInterpretation';

describe('describeScoreBand', () => {
  it('labels high scores as a strength without asserting certainty', () => {
    const band = describeScoreBand(88);
    expect(band.id).toBe('strong');
    expect(band.label).toBe('Strong');
  });

  it('labels mid scores as workable', () => {
    expect(describeScoreBand(65).id).toBe('moderate');
    expect(describeScoreBand(58).id).toBe('moderate');
  });

  it('labels low scores as needing attention rather than as failure', () => {
    const band = describeScoreBand(30);
    expect(band.id).toBe('watch');
    expect(band.label).toBe('Worth discussing');
  });

  it('never describes people or teams as incompatible', () => {
    const labels = [10, 40, 60, 75, 95].map((score) => describeScoreBand(score).label.toLowerCase());
    for (const label of labels) {
      expect(label).not.toMatch(/incompatible|toxic|bad|poor|unfit|mismatch/);
    }
  });

  it('is defined across the whole 0-100 range', () => {
    for (let score = 0; score <= 100; score += 1) {
      expect(describeScoreBand(score).id).toBeTruthy();
    }
  });
});

describe('scoreRange', () => {
  it('widens a point score into an honest range', () => {
    expect(scoreRange(62)).toBe('55–69');
  });

  it('clamps at the bounds instead of exceeding them', () => {
    expect(scoreRange(2)).toBe('0–9');
    expect(scoreRange(98)).toBe('91–100');
  });
});

describe('scoreCaveat', () => {
  it('states that scores are a discussion prompt, not a measurement', () => {
    expect(scoreCaveat).toMatch(/discussion|conversation/i);
    expect(scoreCaveat).toMatch(/not/i);
  });
});
