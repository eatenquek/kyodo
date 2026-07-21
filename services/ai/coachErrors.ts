export function describeCoachError(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const lower = message.toLowerCase();

  if (lower.includes('supabase must be configured')) {
    return 'Kyodo needs you to be online and signed in. Reconnect and try again.';
  }
  if (lower.includes('sign in')) {
    return 'Please sign in again to use Kyodo.';
  }
  if (lower.includes('team member')) {
    return 'Only members of this team can use Kyodo here.';
  }
  if (lower.includes('not configured')) {
    return "Kyodo isn't set up on the server yet. Please contact the team admin.";
  }
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('fetcherror')) {
    return "Kyodo couldn't reach the server. Check your connection and try again.";
  }
  return 'Kyodo is having trouble right now. Please try again in a moment.';
}
