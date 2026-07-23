import { describe, expect, it } from 'vitest';
import { getDimensionCoverage, normalizeAnswer, scoreQuestionnaire } from '@/services/scoring/questionnaireScoring';
import { dimensionLabels, questions } from '@/constants/questions';
import { WorkstyleScores } from '@/types/domain';
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

describe('questionnaire instrument integrity', () => {
  it('backs every dimension with at least two of its own items', () => {
    const coverage = getDimensionCoverage();
    for (const [dimension, count] of Object.entries(coverage)) {
      expect(count, `${dimension} needs >= 2 items, has ${count}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('never lets one item feed more than one dimension', () => {
    const seen = new Map<string, string>();
    for (const question of questions) {
      expect(seen.has(question.id), `${question.id} is used twice`).toBe(false);
      seen.set(question.id, question.dimension);
    }
    expect(seen.size).toBe(questions.length);
  });

  it('covers every scored dimension with questions', () => {
    const scored = Object.keys(scoreQuestionnaire('user-1', allNeutralAnswers())).filter(
      (key) => !['userId', 'resultLabel', 'summaryText', 'createdAt'].includes(key)
    ) as Array<keyof WorkstyleScores>;
    const covered = Object.keys(getDimensionCoverage());
    for (const dimension of scored) {
      expect(covered, `${dimension} is scored but has no items`).toContain(dimension);
    }
    // Every dimension is also labelled for the UI.
    for (const dimension of covered) {
      expect(dimensionLabels[dimension as keyof typeof dimensionLabels]).toBeTruthy();
    }
  });

  it('balances agreement bias with reverse-scored items', () => {
    expect(questions.filter((question) => question.reverse).length).toBeGreaterThanOrEqual(4);
  });
});
