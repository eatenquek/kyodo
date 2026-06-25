import { Dimension, Question } from '@/types/domain';

export const dimensionLabels: Record<Dimension, string> = {
  planning: 'Planning Style',
  communication: 'Communication Style',
  leadership: 'Leadership Preference',
  pace: 'Work Pace',
  conflict: 'Conflict Style',
  detail: 'Detail Orientation',
  initiative: 'Initiative',
  flexibility: 'Flexibility'
};

export const dimensionDescriptions: Record<Dimension, string> = {
  planning: 'How much structure you prefer before starting.',
  communication: 'How you prefer to share updates and ask questions.',
  leadership: 'How naturally you step into coordination.',
  pace: 'How quickly you prefer to move from idea to action.',
  conflict: 'How you tend to handle disagreement.',
  detail: 'How much attention you give to details and polish.',
  initiative: 'How readily you start tasks and unblock work.',
  flexibility: 'How comfortably you adapt when plans change.'
};

export const questionnaireVersion = 'kyodo-15-v1';

export const questions: Question[] = [
  { id: 'kyodo15_q01', dimension: 'planning', prompt: 'I like teams to agree on goals, roles, and deadlines early.', reverse: false },
  { id: 'kyodo15_q02', dimension: 'planning', prompt: 'I am comfortable starting before the plan is fully clear.', reverse: false },
  { id: 'kyodo15_q03', dimension: 'communication', prompt: 'I prefer regular check-ins rather than long silent stretches.', reverse: false },
  { id: 'kyodo15_q04', dimension: 'communication', prompt: 'I would rather work independently and only update when needed.', reverse: true },
  { id: 'kyodo15_q05', dimension: 'initiative', prompt: 'I usually start tasks without waiting to be asked.', reverse: false },
  { id: 'kyodo15_q06', dimension: 'pace', prompt: 'If I commit to a task, people can rely on me to deliver it on time.', reverse: false },
  { id: 'kyodo15_q07', dimension: 'leadership', prompt: 'I am comfortable making a decision when the team is stuck.', reverse: false },
  { id: 'kyodo15_q08', dimension: 'leadership', prompt: 'I would rather support a coordinator than be the coordinator.', reverse: true },
  { id: 'kyodo15_q09', dimension: 'pace', prompt: 'I prefer working steadily across the timeline instead of rushing at the end.', reverse: false },
  { id: 'kyodo15_q10', dimension: 'flexibility', prompt: 'I adapt well when the plan changes mid-project.', reverse: false },
  { id: 'kyodo15_q11', dimension: 'detail', prompt: 'I naturally notice small errors or missing details in group work.', reverse: false },
  { id: 'kyodo15_q12', dimension: 'detail', prompt: 'When time is tight, I am happy to ship something “good enough.”', reverse: true },
  { id: 'kyodo15_q13', dimension: 'conflict', prompt: 'If I disagree with teammates, I usually say it directly and respectfully.', reverse: false },
  { id: 'kyodo15_q14', dimension: 'conflict', prompt: 'I tend to avoid disagreement unless someone else brings it up first.', reverse: true },
  { id: 'kyodo15_q15', dimension: 'communication', prompt: 'I often help the team by summarizing next steps and checking progress.', reverse: false }
];

export const answerOptions = [
  { label: 'Strongly disagree', value: 1 },
  { label: 'Disagree', value: 2 },
  { label: 'Neutral', value: 3 },
  { label: 'Agree', value: 4 },
  { label: 'Strongly agree', value: 5 }
];

export const preferredRoles = ['Coordinator', 'Builder', 'Researcher', 'Designer', 'Presenter', 'Flexible'];
