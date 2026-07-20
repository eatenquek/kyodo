import { describe, expect, it } from 'vitest';
import { normalizeAnswer, scoreQuestionnaire } from '@/services/scoring/questionnaireScoring';
import { allNeutralAnswers } from './fixtures';

describe('normalizeAnswer', () => {
  it('maps the Likert scale to 0-100 for non-reverse items', () => {
    expect(normalizeAnswer(1, false)).toBe(0);
    expect(normalizeAnswer(3, false)).toBe(50);
    expect(normalizeAnswer(5, false)).toBe(100);
  });

  it('inverts reverse-scored items', () => {
    expect(normalizeAnswer(5, true)).toBe(0);
    expect(normalizeAnswer(3, true)).toBe(50);
    expect(normalizeAnswer(1, true)).toBe(100);
  });

  it('rejects out-of-range or non-integer answers', () => {
    expect(() => normalizeAnswer(0, false)).toThrow();
    expect(() => normalizeAnswer(6, false)).toThrow();
    expect(() => normalizeAnswer(2.5, false)).toThrow();
  });
});

describe('scoreQuestionnaire', () => {
  it('scores every dimension at 50 when all answers are neutral', () => {
    const result = scoreQuestionnaire('user-1', allNeutralAnswers());
    expect(result.planning).toBe(50);
    expect(result.communication).toBe(50);
    expect(result.pace).toBe(50);
    expect(result.decisionComfort).toBe(50);
    expect(result.accountability).toBe(50);
    expect(result.resultLabel).toBe('Coordinator-Minded Planner');
  });

  it('throws when answers are missing', () => {
    expect(() => scoreQuestionnaire('user-1', [])).toThrow();
  });
});
