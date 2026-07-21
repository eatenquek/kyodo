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

  if (error) throw new Error(error.message);
  if (!data) throw new Error('No AI coach advice was returned.');

  return data;
}
