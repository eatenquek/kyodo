import { AvailabilityBlock, TeamMember } from '@/types/domain';

// separate from work-style scores on purpose - schedule overlap is a hard
// constraint, not a preference, so it shouldn't get blended into the fit score

export const availabilityBlocks: Array<{ id: AvailabilityBlock; label: string; short: string }> = [
  { id: 'weekdayMorning', label: 'Weekday mornings', short: 'Wkday AM' },
  { id: 'weekdayAfternoon', label: 'Weekday afternoons', short: 'Wkday PM' },
  { id: 'weekdayEvening', label: 'Weekday evenings', short: 'Wkday eve' },
  { id: 'weekendMorning', label: 'Weekend mornings', short: 'Wknd AM' },
  { id: 'weekendAfternoon', label: 'Weekend afternoons', short: 'Wknd PM' },
  { id: 'weekendEvening', label: 'Weekend evenings', short: 'Wknd eve' }
];

const blockLabel = new Map(availabilityBlocks.map((block) => [block.id, block.label]));

export type AvailabilityOverlap = {
  score: number; // 0-100
  sharedBlocks: AvailabilityBlock[]; // blocks everyone with stated availability can make
  sharedLabels: string[];
  nearMissBlocks: AvailabilityBlock[]; // all but one member can make these
  membersWithoutAvailability: string[]; // excluded from the maths, not assumed free
  consideredCount: number;
  summary: string;
};

function scoreFromShared(sharedCount: number, nearMissCount: number) {
  if (sharedCount >= 3) return 92;
  if (sharedCount === 2) return 78;
  if (sharedCount === 1) return 62;
  return nearMissCount > 0 ? 34 : 12;
}

export function calculateAvailabilityOverlap(members: TeamMember[]): AvailabilityOverlap | null {
  const stated = members.filter((member) => (member.availability?.length ?? 0) > 0);
  const missing = members.filter((member) => !(member.availability?.length ?? 0)).map((m) => m.name || 'Teammate');

  if (stated.length < 2) return null; // one person's calendar isn't an overlap

  const counts = new Map<AvailabilityBlock, number>();
  for (const member of stated) {
    for (const block of new Set(member.availability ?? [])) {
      counts.set(block, (counts.get(block) ?? 0) + 1);
    }
  }

  const ordered = availabilityBlocks.map((block) => block.id);
  const sharedBlocks = ordered.filter((block) => counts.get(block) === stated.length);
  const nearMissBlocks = ordered.filter((block) => counts.get(block) === stated.length - 1 && stated.length > 2);

  const score = scoreFromShared(sharedBlocks.length, nearMissBlocks.length);
  const sharedLabels = sharedBlocks.map((block) => blockLabel.get(block)!);

  return {
    score,
    sharedBlocks,
    sharedLabels,
    nearMissBlocks,
    membersWithoutAvailability: missing,
    consideredCount: stated.length,
    summary: buildSummary(sharedLabels, nearMissBlocks, missing.length)
  };
}

function buildSummary(sharedLabels: string[], nearMissBlocks: AvailabilityBlock[], missingCount: number) {
  const caveat = missingCount
    ? ` ${missingCount} ${missingCount === 1 ? 'teammate has' : 'teammates have'} not added availability yet.`
    : '';

  if (sharedLabels.length >= 2) {
    return `Everyone can meet during ${sharedLabels.slice(0, 2).join(' and ').toLowerCase()}.${caveat}`;
  }
  if (sharedLabels.length === 1) {
    return `The only slot everyone shares is ${sharedLabels[0].toLowerCase()}, so protect it.${caveat}`;
  }
  if (nearMissBlocks.length) {
    const label = blockLabel.get(nearMissBlocks[0])!.toLowerCase();
    return `No slot works for everyone, but all but one can make ${label}. Agree how to include the person who cannot.${caveat}`;
  }
  return `No shared time slot yet. Agree on asynchronous working, or find a compromise slot before planning meetings.${caveat}`;
}
