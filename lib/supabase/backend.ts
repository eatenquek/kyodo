import { calculateTeamCompatibility } from '@/services/scoring/compatibilityScoring';
import { questionnaireVersion, questions } from '@/constants/questions';
import {
  Answer,
  CompatibilityResult,
  CompatibilityRoleCoverage,
  PersonalityResult,
  Profile,
  Team
} from '@/types/domain';
import { generateJoinCode } from '@/utils/generateJoinCode';
import { isSupabaseConfigured, supabase } from './client';

export const backendEnabled = isSupabaseConfigured && Boolean(supabase);

type BackendSnapshot = {
  profile: Profile | null;
  answers: Record<string, Answer>;
  result: PersonalityResult | null;
  teams: Team[];
  compatibility: Record<string, CompatibilityResult>;
  activeTeamId?: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
  university: string | null;
  course: string | null;
  year_of_study: number | null;
  preferred_role: string | null;
  bio: string | null;
  onboarding_completed: boolean | null;
};

type AnswerRow = {
  question_id: string;
  answer_value: number;
};

type ResultRow = {
  user_id: string;
  planning_score: number;
  communication_score: number;
  leadership_score: number;
  pace_score: number;
  conflict_score: number;
  detail_score: number;
  initiative_score: number | null;
  flexibility_score: number | null;
  accountability_score: number | null;
  decision_comfort_score: number | null;
  questionnaire_version: string | null;
  result_label: string;
  summary_text: string;
  created_at: string;
};

type TeamRow = {
  id: string;
  name: string;
  project_name: string | null;
  description: string | null;
  join_code: string;
  created_by: string | null;
  join_code_updated_at: string | null;
};

const teamColumns = 'id,name,project_name,description,join_code,created_by,join_code_updated_at';

type JoinByCodeRow = { team_id: string; already_member: boolean };

type MemberRow = {
  team_id: string;
  user_id: string;
  role: string;
};

type CompatibilityRow = {
  team_id: string;
  score: number;
  score_label: string;
  strengths: string[];
  frictions: string[];
  tips: string[];
  created_at: string;
  pair_fit_score: number | null;
  role_coverage_score: number | null;
  coordinator_health_score: number | null;
  suggested_coordinator: string | null;
  role_coverage: CompatibilityRoleCoverage[] | null;
  shared_responsibilities: string[] | null;
  overlap_risks: string[] | null;
  gaps: string[] | null;
};

const compatibilityColumns =
  'team_id,score,score_label,strengths,frictions,tips,created_at,pair_fit_score,role_coverage_score,coordinator_health_score,suggested_coordinator,role_coverage,shared_responsibilities,overlap_risks,gaps';

function mapCompatibility(row: CompatibilityRow): CompatibilityResult {
  return {
    teamId: row.team_id,
    score: row.score,
    scoreLabel: row.score_label,
    strengths: row.strengths,
    frictions: row.frictions,
    tips: row.tips,
    createdAt: row.created_at,
    pairFitScore: row.pair_fit_score ?? undefined,
    roleCoverageScore: row.role_coverage_score ?? undefined,
    coordinatorHealthScore: row.coordinator_health_score ?? undefined,
    suggestedCoordinator: row.suggested_coordinator ?? undefined,
    roleCoverage: row.role_coverage ?? undefined,
    sharedResponsibilities: row.shared_responsibilities ?? undefined,
    overlapRisks: row.overlap_risks ?? undefined,
    gaps: row.gaps ?? undefined
  };
}

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function throwBackendError(error: { message?: string }) {
  const message = error.message ?? 'Supabase request failed.';
  if (message.includes("Could not find the table 'public.")) {
    throw new Error(`${message}. Run supabase/schema.sql in the Supabase SQL Editor, then restart Expo.`);
  }
  if (
    ['initiative_score', 'flexibility_score', 'accountability_score', 'decision_comfort_score', 'questionnaire_version'].some(
      (column) => message.includes(column)
    )
  ) {
    throw new Error(`${message}. Apply the latest Supabase migration before completing the new questionnaire.`);
  }
  if (
    ['pair_fit_score', 'role_coverage_score', 'coordinator_health_score', 'suggested_coordinator', 'role_coverage'].some(
      (column) => message.includes(column)
    )
  ) {
    throw new Error(`${message}. Run 'supabase db push' to apply the compatibility report migration.`);
  }
  if (message.includes('join_code') && message.includes('row-level security')) {
    throw new Error('Only the team owner can change the join code.');
  }
  throw new Error(message);
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    university: row.university ?? undefined,
    course: row.course ?? undefined,
    yearOfStudy: row.year_of_study ?? undefined,
    preferredRole: row.preferred_role ?? 'Flexible',
    bio: row.bio ?? undefined,
    onboardingCompleted: Boolean(row.onboarding_completed)
  };
}

type CurrentResultRow = ResultRow & {
  initiative_score: number;
  flexibility_score: number;
  accountability_score: number;
  decision_comfort_score: number;
};

function isCurrentResult(row: ResultRow): row is CurrentResultRow {
  return (
    row.questionnaire_version === questionnaireVersion &&
    Number.isFinite(row.initiative_score) &&
    Number.isFinite(row.flexibility_score) &&
    Number.isFinite(row.accountability_score) &&
    Number.isFinite(row.decision_comfort_score)
  );
}

function mapResult(row: CurrentResultRow): PersonalityResult {
  return {
    userId: row.user_id,
    planning: row.planning_score,
    communication: row.communication_score,
    leadership: row.leadership_score,
    pace: row.pace_score,
    conflict: row.conflict_score,
    detail: row.detail_score,
    initiative: row.initiative_score,
    flexibility: row.flexibility_score,
    accountability: row.accountability_score,
    decisionComfort: row.decision_comfort_score,
    resultLabel: row.result_label,
    summaryText: row.summary_text,
    createdAt: row.created_at
  };
}

function resultToRow(result: PersonalityResult) {
  return {
    user_id: result.userId,
    planning_score: result.planning,
    communication_score: result.communication,
    leadership_score: result.leadership,
    pace_score: result.pace,
    conflict_score: result.conflict,
    detail_score: result.detail,
    initiative_score: result.initiative,
    flexibility_score: result.flexibility,
    accountability_score: result.accountability,
    decision_comfort_score: result.decisionComfort,
    questionnaire_version: questionnaireVersion,
    result_label: result.resultLabel,
    summary_text: result.summaryText
  };
}

export async function loadBackendSnapshot(userId: string, email: string): Promise<BackendSnapshot> {
  const client = requireClient();

  const [{ data: profileRow }, { data: answerRows }, { data: ownResultRows }, { data: memberRows }] = await Promise.all([
    client.from('profiles').select('*').eq('id', userId).maybeSingle<ProfileRow>(),
    client.from('questionnaire_answers').select('*').eq('user_id', userId).returns<AnswerRow[]>(),
    client
      .from('personality_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .returns<ResultRow[]>(),
    client.from('team_members').select('team_id,user_id,role').eq('user_id', userId).returns<MemberRow[]>()
  ]);

  const profile = profileRow ? mapProfile(profileRow) : null;
  const answers = Object.fromEntries(
    (answerRows ?? []).map((row) => [
      row.question_id,
      {
        questionId: row.question_id,
        value: row.answer_value
      }
    ])
  );
  const currentResultRow = ownResultRows?.find(isCurrentResult);
  const result = currentResultRow ? mapResult(currentResultRow) : null;

  const teamIds = [...new Set((memberRows ?? []).map((row) => row.team_id))];
  if (!teamIds.length) {
    return { profile, answers, result, teams: [], compatibility: {} };
  }

  const [{ data: teamRows }, { data: allMemberRows }, { data: compatibilityRows }] = await Promise.all([
    client.from('teams').select(teamColumns).in('id', teamIds).returns<TeamRow[]>(),
    client.from('team_members').select('team_id,user_id,role').in('team_id', teamIds).returns<MemberRow[]>(),
    client
      .from('compatibility_results')
      .select(compatibilityColumns)
      .in('team_id', teamIds)
      .order('created_at', { ascending: false })
      .returns<CompatibilityRow[]>()
  ]);

  const memberUserIds = [...new Set((allMemberRows ?? []).map((row) => row.user_id))];
  const [{ data: profileRows }, { data: resultRows }] = await Promise.all([
    memberUserIds.length
      ? client.from('profiles').select('*').in('id', memberUserIds).returns<ProfileRow[]>()
      : Promise.resolve({ data: [] as ProfileRow[] }),
    memberUserIds.length
      ? client
          .from('personality_results')
          .select('*')
          .in('user_id', memberUserIds)
          .order('created_at', { ascending: false })
          .returns<ResultRow[]>()
      : Promise.resolve({ data: [] as ResultRow[] })
  ]);

  const profiles = new Map((profileRows ?? []).map((row) => [row.id, mapProfile(row)]));
  const latestResults = new Map<string, PersonalityResult>();
  for (const row of resultRows ?? []) {
    if (isCurrentResult(row) && !latestResults.has(row.user_id)) latestResults.set(row.user_id, mapResult(row));
  }

  const teams = (teamRows ?? []).map<Team>((team) => ({
    id: team.id,
    name: team.name,
    projectName: team.project_name ?? undefined,
    description: team.description ?? undefined,
    joinCode: team.join_code,
    createdBy: team.created_by ?? undefined,
    joinCodeUpdatedAt: team.join_code_updated_at ?? undefined,
    members: (allMemberRows ?? [])
      .filter((member) => member.team_id === team.id)
      .map((member) => {
        const memberProfile = profiles.get(member.user_id);
        return {
          id: member.user_id,
          name: memberProfile?.fullName ?? (member.user_id === userId ? email : 'Teammate'),
          role: memberProfile?.preferredRole ?? member.role,
          result: latestResults.get(member.user_id)
        };
      })
  }));

  // Rows arrive newest-first, so the first row per team is the latest stored report.
  const compatibility: Record<string, CompatibilityResult> = {};
  for (const row of compatibilityRows ?? []) {
    if (compatibility[row.team_id]) continue;
    compatibility[row.team_id] = mapCompatibility(row);
  }

  for (const team of teams) {
    const calculated = calculateTeamCompatibility(team);
    if (!calculated) continue;
    compatibility[team.id] = {
      ...calculated,
      createdAt: compatibility[team.id]?.createdAt ?? calculated.createdAt
    };
  }

  return { profile, answers, result, teams, compatibility, activeTeamId: teams[0]?.id };
}

export async function saveBackendProfile(userId: string, profile: Omit<Profile, 'id' | 'onboardingCompleted'>) {
  const client = requireClient();
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session || sessionData.session.user.id !== userId) {
    throw new Error('Confirm your email and sign in before saving your profile.');
  }

  const { error } = await client.from('profiles').upsert({
    id: userId,
    full_name: profile.fullName,
    university: profile.university,
    course: profile.course,
    year_of_study: profile.yearOfStudy,
    preferred_role: profile.preferredRole,
    bio: profile.bio,
    onboarding_completed: true,
    updated_at: new Date().toISOString()
  });
  if (error) throwBackendError(error);
}

export async function saveBackendAnswer(userId: string, answer: Answer) {
  const client = requireClient();
  const question = questions.find((item) => item.id === answer.questionId);
  if (!question) throw new Error('This questionnaire item is not part of the current version.');
  const { error } = await client.from('questionnaire_answers').upsert(
    {
      user_id: userId,
      question_id: answer.questionId,
      dimension: question.dimension,
      answer_value: answer.value,
      is_reverse_scored: question.reverse,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id,question_id' }
  );
  if (error) throwBackendError(error);
}

export async function saveBackendResult(result: PersonalityResult) {
  const client = requireClient();
  const { error } = await client.from('personality_results').insert(resultToRow(result));
  if (error) throwBackendError(error);
}

export async function createBackendTeam(userId: string, name: string, projectName: string, description: string) {
  const client = requireClient();
  let joinCode = generateJoinCode();
  let createdTeam: TeamRow | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await client
      .from('teams')
      .insert({
        name: name.trim(),
        project_name: projectName.trim() || null,
        description: description.trim() || null,
        join_code: joinCode,
        created_by: userId
      })
      .select(teamColumns)
      .single<TeamRow>();

    if (!error && data) {
      createdTeam = data;
      break;
    }
    joinCode = generateJoinCode();
  }

  if (!createdTeam) throw new Error('Could not create a unique team code.');

  const { error: memberError } = await client.from('team_members').insert({
    team_id: createdTeam.id,
    user_id: userId,
    role: 'owner'
  });
  if (memberError) throwBackendError(memberError);

  return createdTeam.id;
}

// joins via an rpc so the client never has to read the teams table directly
export async function joinBackendTeam(_userId: string, joinCode: string) {
  const client = requireClient();
  const { data, error } = await client.rpc('join_team_by_code', { p_code: joinCode.trim().toUpperCase() });

  if (error) {
    if (error.code === 'PGRST202' || error.message.includes('join_team_by_code')) {
      throw new Error("Joining is not set up on the server yet. Run 'supabase db push' to apply the latest migration.");
    }
    throwBackendError(error);
  }

  const [match] = (data ?? []) as JoinByCodeRow[];
  return Boolean(match) && !match.already_member;
}

// owner-only, retries a couple times if the new code happens to collide
export async function rotateBackendJoinCode(teamId: string) {
  const client = requireClient();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const joinCode = generateJoinCode();
    const { data, error } = await client
      .from('teams')
      .update({ join_code: joinCode, join_code_updated_at: new Date().toISOString() })
      .eq('id', teamId)
      .select('join_code')
      .maybeSingle<{ join_code: string }>();

    if (!error && data) return data.join_code;
    if (error && error.code !== '23505') throwBackendError(error);
    if (!error && !data) throw new Error('Only the team owner can change the join code.');
  }

  throw new Error('Could not generate a new team code. Try again.');
}

export async function leaveBackendTeam(userId: string, teamId: string) {
  const client = requireClient();
  const { error } = await client.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId);
  if (error) throwBackendError(error);
}

export async function saveBackendCompatibility(result: CompatibilityResult) {
  const client = requireClient();
  const { error } = await client.from('compatibility_results').insert({
    team_id: result.teamId,
    score: result.score,
    score_label: result.scoreLabel,
    strengths: result.strengths,
    frictions: result.frictions,
    tips: result.tips,
    pair_fit_score: result.pairFitScore ?? null,
    role_coverage_score: result.roleCoverageScore ?? null,
    coordinator_health_score: result.coordinatorHealthScore ?? null,
    suggested_coordinator: result.suggestedCoordinator ?? null,
    role_coverage: result.roleCoverage ?? [],
    shared_responsibilities: result.sharedResponsibilities ?? [],
    overlap_risks: result.overlapRisks ?? [],
    gaps: result.gaps ?? []
  });
  if (error) throwBackendError(error);
}

export function calculateCompatibilityForTeam(team: Team) {
  return calculateTeamCompatibility(team);
}
