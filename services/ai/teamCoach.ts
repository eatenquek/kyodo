import { supabase } from '@/lib/supabase/client';
import { CompatibilityResult, Team } from '@/types/domain';
import { TeamFormationSuggestion } from '@/services/scoring/teamFormation';
import { buildTeamCoachPayload } from '@/services/ai/teamCoachPayload';

export type TeamCoachAdvice = {
  summary: string;
  simulation: string[];
  coachingNotes: string[];
  roleSuggestions: Array<{
    member: string;
    role: string;
    reason: string;
  }>;
  riskWarnings: string[];
  workingAgreement: string[];
  firstMeetingPlan: string[];
  cached?: boolean;
};

// functions.invoke reports a non-2xx as "Edge Function returned a non-2xx status
// code" and leaves the real reason in the unread response body, so read it back
async function readFunctionError(error: unknown) {
  const fallback = error instanceof Error ? error.message : 'AI coach request failed.';
  const response = (error as { context?: unknown })?.context;

  if (!(response instanceof Response)) return fallback;

  try {
    const body = await response.clone().json();
    if (typeof body?.error === 'string' && body.error) return body.error;
  } catch {
    // body was empty or not json, fall through to the generic message
  }

  return fallback;
}

export async function generateTeamCoachAdvice({
  team,
  compatibility,
  formation,
  targetGroupSize,
  refresh = false
}: {
  team: Team;
  compatibility?: CompatibilityResult;
  formation?: TeamFormationSuggestion | null;
  targetGroupSize?: number;
  refresh?: boolean;
}) {
  if (!supabase) {
    throw new Error('Supabase must be configured before generating AI coach advice.');
  }

  const { data, error } = await supabase.functions.invoke<TeamCoachAdvice>('ai-team-coach', {
    body: buildTeamCoachPayload({ team, compatibility, formation, targetGroupSize, refresh })
  });

  if (error) throw new Error(await readFunctionError(error));
  if (!data) throw new Error('No AI coach advice was returned.');

  return data;
}
