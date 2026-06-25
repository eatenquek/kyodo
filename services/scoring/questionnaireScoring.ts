import { questions } from '@/constants/questions';
import { Answer, Dimension, PersonalityResult, WorkstyleScores } from '@/types/domain';
import { buildWorkstyleProfile } from './workstyleProfile';

const questionById = new Map(questions.map((question) => [question.id, question]));

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

  const coreScores: Record<Dimension, number> = {
    communication: meanScore(['kyodo15_q03', 'kyodo15_q04', 'kyodo15_q15']),
    planning: meanScore(['kyodo15_q01', 'kyodo15_q02']),
    leadership: meanScore(['kyodo15_q07', 'kyodo15_q08']),
    pace: meanScore(['kyodo15_q06', 'kyodo15_q09']),
    conflict: meanScore(['kyodo15_q13', 'kyodo15_q14']),
    detail: meanScore(['kyodo15_q11', 'kyodo15_q12']),
    initiative: itemScore('kyodo15_q05'),
    flexibility: itemScore('kyodo15_q10')
  };
  const accountability = itemScore('kyodo15_q06');
  const decisionComfort = itemScore('kyodo15_q07');
  const scores: WorkstyleScores = { ...coreScores, accountability, decisionComfort };
  const profile = buildWorkstyleProfile(scores);
  return {
    userId,
    ...scores,
    resultLabel: profile.primary.label,
    summaryText: `Your strongest current tendencies are ${profile.primary.label} and ${profile.secondary.label}. These are flexible work-style signals, not fixed personality labels.`,
    createdAt: new Date().toISOString()
  };
}
