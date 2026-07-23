import { questions } from '@/constants/questions';
import { Answer, Dimension, PersonalityResult, WorkstyleScores } from '@/types/domain';
import { buildWorkstyleProfile } from './workstyleProfile';

const questionById = new Map(questions.map((question) => [question.id, question]));

const itemsByDimension = questions.reduce<Record<Dimension, string[]>>((grouped, question) => {
  (grouped[question.dimension] ??= []).push(question.id);
  return grouped;
}, {} as Record<Dimension, string[]>);

export function getDimensionCoverage() {
  return Object.fromEntries(
    Object.entries(itemsByDimension).map(([dimension, ids]) => [dimension, ids.length])
  ) as Record<Dimension, number>;
}

export function normalizeAnswer(value: number, reverse: boolean) {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error('Questionnaire answers must be whole numbers from 1 to 5.');
  }
  const normalized = (value - 1) * 25;
  return reverse ? 100 - normalized : normalized;
}

export function scoreQuestionnaire(userId: string, answers: Answer[]): PersonalityResult {
  const answerById = new Map(answers.map((answer) => [answer.questionId, answer]));
  const missing = questions.filter((question) => !answerById.has(question.id));
  if (missing.length) {
    throw new Error(`Complete all ${questions.length} questions before generating your result.`);
  }

  function itemScore(questionId: string) {
    const question = questionById.get(questionId);
    const answer = answerById.get(questionId);
    if (!question || !answer) throw new Error(`Missing questionnaire item: ${questionId}`);
    return normalizeAnswer(answer.value, question.reverse);
  }

  function meanScore(questionIds: string[]) {
    return Math.round(questionIds.reduce((sum, questionId) => sum + itemScore(questionId), 0) / questionIds.length);
  }

  // each dimension is just the mean of its own items now, nothing aliased
  const scores: WorkstyleScores = Object.fromEntries(
    Object.entries(itemsByDimension).map(([dimension, questionIds]) => [dimension, meanScore(questionIds)])
  ) as WorkstyleScores;
  const profile = buildWorkstyleProfile(scores);
  return {
    userId,
    ...scores,
    resultLabel: profile.primary.label,
    summaryText: `Your strongest current tendencies are ${profile.primary.label} and ${profile.secondary.label}. These are flexible work-style signals, not fixed personality labels.`,
    createdAt: new Date().toISOString()
  };
}
