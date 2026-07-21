import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { questions } from '@/constants/questions';
import { calculateTeamCompatibility } from '@/services/scoring/compatibilityScoring';
import { scoreQuestionnaire } from '@/services/scoring/questionnaireScoring';
import { resolveActiveTeam } from '@/services/teams/activeTeam';
import {
  backendEnabled,
  createBackendTeam,
  joinBackendTeam,
  leaveBackendTeam,
  loadBackendSnapshot,
  saveBackendAnswer,
  saveBackendCompatibility,
  saveBackendProfile,
  saveBackendResult
} from '@/lib/supabase/backend';
import { supabase } from '@/lib/supabase/client';
import { Answer, CompatibilityResult, PersonalityResult, Profile, Team } from '@/types/domain';
import { generateJoinCode } from '@/utils/generateJoinCode';

type AppUser = { id: string; email: string };
type AuthResult =
  | { ok: true; profileComplete?: boolean; resultComplete?: boolean; requiresEmailConfirmation?: boolean }
  | { ok: false; message: string };

type State = {
  user: AppUser | null;
  registeredEmails: string[];
  profile: Profile | null;
  answers: Record<string, Answer>;
  result: PersonalityResult | null;
  teams: Team[];
  activeTeamId?: string;
  compatibility: Record<string, CompatibilityResult>;
};

type AppContextValue = State & {
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  saveProfile: (profile: Omit<Profile, 'id' | 'onboardingCompleted'>) => Promise<void>;
  saveAnswer: (answer: Answer) => Promise<void>;
  completeQuestionnaire: () => Promise<PersonalityResult>;
  createTeam: (name: string, projectName: string, description: string) => Promise<Team>;
  joinTeam: (joinCode: string) => Promise<boolean>;
  leaveTeam: (teamId: string) => Promise<boolean>;
  selectTeam: (teamId: string) => void;
  getUserTeams: () => Team[];
  getActiveTeam: () => Team | undefined;
  generateCompatibility: () => Promise<CompatibilityResult | null>;
};

const storageKey = 'kyodoai.milestone1';
const AppContext = createContext<AppContextValue | null>(null);

const legacyFixtureEmailPattern = /^demo[1-5]@kyodoai\.app$/;
const legacyFixtureCodePattern = /^(KYODO1|SPRINT|WAIT01)$/;

function isLegacyFixtureEmail(value: string) {
  return legacyFixtureEmailPattern.test(value.toLowerCase());
}

const initialState: State = {
  user: null,
  registeredEmails: [],
  profile: null,
  answers: {},
  result: null,
  activeTeamId: undefined,
  teams: [],
  compatibility: {}
};

const currentResultFields = ['initiative', 'flexibility', 'accountability', 'decisionComfort'] as const;

function isCurrentWorkstyleResult(result: PersonalityResult | null | undefined): result is PersonalityResult {
  return Boolean(result && currentResultFields.every((field) => Number.isFinite(result[field])));
}

function withoutLegacyFixtures(state: State): State {
  const registeredEmails = (state.registeredEmails ?? []).filter((email) => !isLegacyFixtureEmail(email));
  const currentUserId = state.user?.id;
  const questionIds = new Set(questions.map((question) => question.id));
  const answers = Object.fromEntries(
    Object.entries(state.answers ?? {}).filter(
      ([questionId, answer]) => questionIds.has(questionId) && Number.isInteger(answer.value) && answer.value >= 1 && answer.value <= 5
    )
  );
  const retainedTeams = state.teams.filter(
    (team) =>
      !team.id.startsWith('demo-team-') &&
      !legacyFixtureCodePattern.test(team.joinCode) &&
      !team.members.some((member) => isLegacyFixtureEmail(member.id))
  );
  const hasOutdatedTeamResult = retainedTeams.some((team) =>
    team.members.some((member) => member.result && !isCurrentWorkstyleResult(member.result))
  );
  const teams = retainedTeams.map((team) => ({
    ...team,
    members: team.members.map((member) => ({
      ...member,
      result: isCurrentWorkstyleResult(member.result) ? member.result : undefined
    }))
  }));
  const activeTeamId = state.activeTeamId && teams.some((team) => team.id === state.activeTeamId) ? state.activeTeamId : undefined;
  const hasOutdatedOwnResult = Boolean(state.result && !isCurrentWorkstyleResult(state.result));
  const retainedCompatibility =
    hasOutdatedOwnResult || hasOutdatedTeamResult
      ? {}
      : Object.fromEntries(Object.entries(state.compatibility).filter(([teamId]) => teams.some((team) => team.id === teamId)));
  const compatibility: Record<string, CompatibilityResult> = { ...retainedCompatibility };

  for (const team of teams) {
    if (!compatibility[team.id]) continue;
    const calculated = calculateTeamCompatibility(team);
    if (!calculated) continue;
    compatibility[team.id] = {
      ...calculated,
      createdAt: compatibility[team.id].createdAt
    };
  }

  return {
    ...state,
    registeredEmails,
    answers,
    user: state.user && isLegacyFixtureEmail(state.user.id) ? null : state.user,
    profile: state.profile && isLegacyFixtureEmail(state.profile.id) ? null : state.profile,
    result:
      state.result && !isLegacyFixtureEmail(state.result.userId) && isCurrentWorkstyleResult(state.result)
        ? state.result
        : null,
    teams,
    activeTeamId:
      currentUserId && isLegacyFixtureEmail(currentUserId)
        ? undefined
        : activeTeamId ?? teams.find((team) => team.members.some((member) => member.id === currentUserId))?.id,
    compatibility
  };
}

function applyLocalLogin(state: State, email: string): State {
  const normalizedEmail = email.toLowerCase();
  const user = { id: normalizedEmail, email };
  const activeTeam = state.teams.find((team) => team.members.some((member) => member.id === normalizedEmail));
  return { ...state, user, activeTeamId: activeTeam?.id ?? state.activeTeamId };
}

function isKnownAccount(state: State, email: string) {
  const normalizedEmail = email.toLowerCase();
  return state.registeredEmails.includes(normalizedEmail);
}

export function AppProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    async function hydrate() {
      if (backendEnabled && supabase) {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;
        if (sessionUser?.email) {
          const snapshot = await loadBackendSnapshot(sessionUser.id, sessionUser.email);
          setState((current) => ({
            ...current,
            user: { id: sessionUser.id, email: sessionUser.email! },
            profile: snapshot.profile,
            answers: snapshot.answers,
            result: snapshot.result,
            teams: snapshot.teams,
            activeTeamId: snapshot.activeTeamId,
            compatibility: snapshot.compatibility
          }));
        }
        setHydrated(true);
        return;
      }

      const value = await AsyncStorage.getItem(storageKey);
      if (value) setState(withoutLegacyFixtures(JSON.parse(value)));
      setHydrated(true);
    }

    hydrate();
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(storageKey, JSON.stringify(state));
  }, [hydrated, state]);

  const value = useMemo<AppContextValue>(() => {
    const currentUserId = state.user?.id ?? 'local-user';
    const currentMember = () => ({
      id: currentUserId,
      name: state.profile?.fullName || state.user?.email || 'You',
      role: state.profile?.preferredRole || 'Member',
      result: state.result ?? undefined
    });
    const userTeams = () => state.teams.filter((team) => team.members.some((member) => member.id === currentUserId));

    return {
      ...state,
      async signIn(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        if (backendEnabled && supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
          if (error || !data.user?.email) {
            return { ok: false, message: error?.message ?? 'Login failed.' };
          }
          const snapshot = await loadBackendSnapshot(data.user.id, data.user.email);
          setState((current) => ({
            ...current,
            user: { id: data.user.id, email: data.user.email! },
            profile: snapshot.profile,
            answers: snapshot.answers,
            result: snapshot.result,
            teams: snapshot.teams,
            activeTeamId: snapshot.activeTeamId,
            compatibility: snapshot.compatibility
          }));
          return { ok: true, profileComplete: Boolean(snapshot.profile), resultComplete: Boolean(snapshot.result) };
        }

        if (!isKnownAccount(state, normalizedEmail)) {
          return { ok: false, message: 'No account exists for this email. Create an account first.' };
        }
        const nextState = applyLocalLogin(withoutLegacyFixtures(state), normalizedEmail);
        setState(nextState);
        return { ok: true, profileComplete: Boolean(nextState.profile), resultComplete: Boolean(nextState.result) };
      },
      async signUp(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        if (backendEnabled && supabase) {
          const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password });
          if (error || !data.user?.email) {
            return { ok: false, message: error?.message ?? 'Could not create account.' };
          }

          if (!data.user.identities?.length) {
            return { ok: false, message: 'An account already exists for this email. Sign in instead.' };
          }

          if (!data.session) {
            setState((current) => ({ ...current, user: null }));
            return { ok: true, requiresEmailConfirmation: true };
          }

          const signedUpUser = data.user;
          setState((current) => ({
            ...current,
            user: { id: signedUpUser.id, email: signedUpUser.email! },
            profile: null,
            answers: {},
            result: null,
            teams: [],
            activeTeamId: undefined,
            compatibility: {}
          }));
          return { ok: true, profileComplete: false, resultComplete: false };
        }

        if (isKnownAccount(state, normalizedEmail)) {
          return { ok: false, message: 'An account already exists for this email. Log in instead.' };
        }
        setState((current) => ({
          ...withoutLegacyFixtures(current),
          registeredEmails: [...new Set([...(current.registeredEmails ?? []), normalizedEmail])],
          user: { id: normalizedEmail, email: normalizedEmail },
          profile: null,
          answers: {},
          result: null,
          activeTeamId: undefined
        }));
        return { ok: true, profileComplete: false, resultComplete: false };
      },
      async signOut() {
        if (backendEnabled && supabase) await supabase.auth.signOut();
        setState((current) => ({ ...current, user: null }));
        router.replace('/(auth)/welcome');
      },
      async saveProfile(profileInput) {
        const nextProfile = {
          ...profileInput,
          id: currentUserId,
          onboardingCompleted: true
        };
        if (backendEnabled) await saveBackendProfile(currentUserId, profileInput);
        setState((current) => ({
          ...current,
          profile: nextProfile,
          teams: current.teams.map((team) => ({
            ...team,
            members: team.members.map((member) =>
              member.id === currentUserId
                ? { ...member, name: nextProfile.fullName, role: nextProfile.preferredRole }
                : member
            )
          }))
        }));
      },
      async saveAnswer(answer) {
        if (backendEnabled) await saveBackendAnswer(currentUserId, answer);
        setState((current) => ({
          ...current,
          answers: { ...current.answers, [answer.questionId]: answer }
        }));
      },
      async completeQuestionnaire() {
        const answers = questions
          .map((question) => state.answers[question.id])
          .filter((answer): answer is Answer => Boolean(answer));
        const result = scoreQuestionnaire(currentUserId, answers);
        if (backendEnabled) await saveBackendResult(result);
        setState((current) => ({
          ...current,
          result,
          teams: current.teams.map((team) => ({
            ...team,
            members: team.members.map((member) => (member.id === currentUserId ? { ...member, result } : member))
          })),
          compatibility: {}
        }));
        return result;
      },
      async createTeam(name, projectName, description) {
        if (backendEnabled && state.user) {
          const teamId = await createBackendTeam(currentUserId, name, projectName, description);
          const snapshot = await loadBackendSnapshot(currentUserId, state.user.email);
          const team = snapshot.teams.find((item) => item.id === teamId) ?? snapshot.teams[0];
          setState((current) => ({
            ...current,
            profile: snapshot.profile,
            answers: snapshot.answers,
            result: snapshot.result,
            teams: snapshot.teams,
            activeTeamId: team?.id,
            compatibility: snapshot.compatibility
          }));
          if (!team) throw new Error('Team was created but could not be loaded.');
          return team;
        }

        let joinCode = generateJoinCode();
        while (state.teams.some((team) => team.joinCode === joinCode)) {
          joinCode = generateJoinCode();
        }

        const team: Team = {
          id: `team-${Date.now()}`,
          name: name.trim(),
          projectName: projectName.trim(),
          description: description.trim(),
          joinCode,
          members: [currentMember()]
        };
        setState((current) => ({ ...current, teams: [...current.teams, team], activeTeamId: team.id }));
        return team;
      },
      async joinTeam(joinCode) {
        if (backendEnabled && state.user) {
          const joined = await joinBackendTeam(currentUserId, joinCode);
          if (!joined) return false;
          const snapshot = await loadBackendSnapshot(currentUserId, state.user.email);
          const joinedTeam = snapshot.teams.find((team) => team.joinCode === joinCode.trim().toUpperCase());
          setState((current) => ({
            ...current,
            profile: snapshot.profile,
            answers: snapshot.answers,
            result: snapshot.result,
            teams: snapshot.teams,
            activeTeamId: joinedTeam?.id ?? snapshot.activeTeamId,
            compatibility: snapshot.compatibility
          }));
          return true;
        }

        const code = joinCode.trim().toUpperCase();
        const targetTeam = state.teams.find((team) => team.joinCode === code);
        if (!targetTeam || targetTeam.members.some((member) => member.id === currentUserId)) return false;

        setState((current) => ({
          ...current,
          teams: current.teams.map((team) => {
            if (team.id !== targetTeam.id) return team;
            return {
              ...team,
              members: [...team.members, currentMember()]
            };
          }),
          activeTeamId: targetTeam.id
        }));
        return true;
      },
      async leaveTeam(teamId) {
        if (backendEnabled && state.user) {
          await leaveBackendTeam(currentUserId, teamId);
          const snapshot = await loadBackendSnapshot(currentUserId, state.user.email);
          setState((current) => ({
            ...current,
            profile: snapshot.profile,
            answers: snapshot.answers,
            result: snapshot.result,
            teams: snapshot.teams,
            activeTeamId: snapshot.activeTeamId,
            compatibility: snapshot.compatibility
          }));
          return true;
        }

        const targetTeam = state.teams.find((team) => team.id === teamId);
        if (!targetTeam || !targetTeam.members.some((member) => member.id === currentUserId)) return false;

        const nextTeams = state.teams.map((team) =>
          team.id === teamId
            ? { ...team, members: team.members.filter((member) => member.id !== currentUserId) }
            : team
        );
        const nextUserTeam = nextTeams.find((team) => team.members.some((member) => member.id === currentUserId));
        setState((current) => ({
          ...current,
          teams: nextTeams,
          activeTeamId: current.activeTeamId === teamId ? nextUserTeam?.id : current.activeTeamId,
          compatibility: Object.fromEntries(Object.entries(current.compatibility).filter(([id]) => id !== teamId))
        }));
        return true;
      },
      selectTeam(teamId) {
        setState((current) => ({ ...current, activeTeamId: teamId }));
      },
      getUserTeams() {
        return userTeams();
      },
      getActiveTeam() {
        return resolveActiveTeam(state.teams, state.activeTeamId, currentUserId);
      },
      async generateCompatibility() {
        const team = resolveActiveTeam(state.teams, state.activeTeamId, currentUserId);
        if (!team) return null;
        const result = calculateTeamCompatibility(team);
        if (result) {
          if (backendEnabled) await saveBackendCompatibility(result);
          setState((current) => ({ ...current, compatibility: { ...current.compatibility, [team.id]: result } }));
        }
        return result;
      }
    };
  }, [state]);

  if (!hydrated) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used within AppProvider');
  return context;
}
