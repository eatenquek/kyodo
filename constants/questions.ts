import { Dimension, Question } from '@/types/domain';

export const dimensionLabels: Record<Dimension, string> = {
  planning: 'Planning Style',
  communication: 'Communication Style',
  leadership: 'Leadership Preference',
  pace: 'Work Pace',
  conflict: 'Conflict Style',
  detail: 'Detail Orientation',
  collaboration: 'Collaboration Preference'
};

export const dimensionDescriptions: Record<Dimension, string> = {
  planning: 'How much structure you prefer before starting.',
  communication: 'How you prefer to share updates and ask questions.',
  leadership: 'How naturally you step into coordination.',
  pace: 'How quickly you prefer to move from idea to action.',
  conflict: 'How you tend to handle disagreement.',
  detail: 'How much attention you give to details and polish.',
  collaboration: 'How much shared working time you prefer.'
};

export const questions: Question[] = [
  { id: 'planning_01', dimension: 'planning', prompt: 'I prefer setting milestones before starting project work.', reverse: false },
  { id: 'planning_02', dimension: 'planning', prompt: 'I feel more comfortable when the team has a clear task list.', reverse: false },
  { id: 'planning_03', dimension: 'planning', prompt: 'I am fine starting with a rough idea and figuring things out later.', reverse: true },
  { id: 'communication_01', dimension: 'communication', prompt: 'I like teammates to give regular progress updates.', reverse: false },
  { id: 'communication_02', dimension: 'communication', prompt: 'I usually ask questions early if something is unclear.', reverse: false },
  { id: 'communication_03', dimension: 'communication', prompt: 'I prefer fewer messages as long as everyone knows their task.', reverse: true },
  { id: 'leadership_01', dimension: 'leadership', prompt: 'I naturally step in to organize the team when things feel unclear.', reverse: false },
  { id: 'leadership_02', dimension: 'leadership', prompt: 'I am comfortable making decisions when the team needs direction.', reverse: false },
  { id: 'leadership_03', dimension: 'leadership', prompt: 'I prefer contributing without being responsible for coordination.', reverse: true },
  { id: 'pace_01', dimension: 'pace', prompt: 'I like turning ideas into drafts quickly.', reverse: false },
  { id: 'pace_02', dimension: 'pace', prompt: 'I prefer making visible progress early, even if the first version is rough.', reverse: false },
  { id: 'pace_03', dimension: 'pace', prompt: 'I like taking more time to think before starting implementation.', reverse: true },
  { id: 'conflict_01', dimension: 'conflict', prompt: 'I raise concerns early when I disagree with a direction.', reverse: false },
  { id: 'conflict_02', dimension: 'conflict', prompt: 'I am comfortable discussing project problems directly.', reverse: false },
  { id: 'conflict_03', dimension: 'conflict', prompt: 'I usually avoid disagreement unless it becomes serious.', reverse: true },
  { id: 'detail_01', dimension: 'detail', prompt: 'I often notice small mistakes or inconsistencies in project work.', reverse: false },
  { id: 'detail_02', dimension: 'detail', prompt: 'I like reviewing work carefully before submission.', reverse: false },
  { id: 'detail_03', dimension: 'detail', prompt: 'I prefer focusing on the overall idea instead of small details.', reverse: true },
  { id: 'collaboration_01', dimension: 'collaboration', prompt: 'I work best when the team discusses tasks frequently.', reverse: false },
  { id: 'collaboration_02', dimension: 'collaboration', prompt: 'I enjoy solving problems together with teammates.', reverse: false },
  { id: 'collaboration_03', dimension: 'collaboration', prompt: 'I prefer owning my part independently most of the time.', reverse: true }
];

export const answerOptions = [
  { label: 'Strongly disagree', value: 1 },
  { label: 'Disagree', value: 2 },
  { label: 'Neutral', value: 3 },
  { label: 'Agree', value: 4 },
  { label: 'Strongly agree', value: 5 }
];

export const preferredRoles = ['Coordinator', 'Builder', 'Researcher', 'Designer', 'Presenter', 'Flexible'];
