export type CoachAvailability = {
  canGenerate: boolean;
  reason: string;
};

export function getCoachAvailability({
  memberCount,
  completedResultCount,
  hasCompatibility,
  hasFormation
}: {
  memberCount: number;
  completedResultCount: number;
  hasCompatibility: boolean;
  hasFormation: boolean;
}): CoachAvailability {
  if (completedResultCount < 2) {
    return {
      canGenerate: false,
      reason: 'Kyodo needs at least 2 completed work-style profiles on this team.'
    };
  }

  if (!hasCompatibility && !hasFormation) {
    return {
      canGenerate: false,
      reason: 'Generate compatibility insights first, then Kyodo can coach from them.'
    };
  }

  if (completedResultCount < memberCount) {
    return {
      canGenerate: true,
      reason: "Some members haven't finished their profile yet. Kyodo will coach from the ones that are ready."
    };
  }

  return { canGenerate: true, reason: '' };
}
