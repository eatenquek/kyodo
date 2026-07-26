import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { AppButton, Screen } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppState } from '@/lib/appState';
import { CohortFormationOutcome, planCohortFormation } from '@/services/cohorts/cohortFormation';
import { describeScoreBand, scoreCaveat, scoreRange } from '@/services/scoring/scoreInterpretation';
import { buildInvitePath } from '@/services/teams/inviteLink';
import { CohortMember } from '@/types/domain';
import { TargetSizeStepper } from '@/components/cohorts/TargetSizeStepper';
import { CohortFormModal, CohortFormMode } from '@/components/cohorts/CohortFormModal';
import { ConfirmModal } from '@/components/ConfirmModal';

// organiser view - the roster plus the group split run across the whole cohort
export default function CohortDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cohortId = Array.isArray(id) ? id[0] : id;
  const { cohorts, loadCohorts, loadCohortRoster, setCohortTargetSize, deleteCohort } = useAppState();

  const cohort = cohorts.find((item) => item.id === cohortId);
  const [roster, setRoster] = useState<CohortMember[] | null>(null);
  const [error, setError] = useState('');
  const [splitting, setSplitting] = useState(false);
  const [outcome, setOutcome] = useState<CohortFormationOutcome | null>(null);
  const [targetSize, setTargetSize] = useState(cohort?.targetGroupSize ?? 4);
  const [notice, setNotice] = useState('');
  const [formMode, setFormMode] = useState<CohortFormMode>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [removed, setRemoved] = useState(false);

  // refs so the load effect doesn't loop (same reason as the teams screen)
  const loadCohortsRef = useRef(loadCohorts);
  const loadRosterRef = useRef(loadCohortRoster);
  loadCohortsRef.current = loadCohorts;
  loadRosterRef.current = loadCohortRoster;

  const load = useCallback(async () => {
    if (!cohortId) return;
    try {
      setError('');
      await loadCohortsRef.current();
      setRoster(await loadRosterRef.current(cohortId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this cohort.');
      setRoster([]);
    }
  }, [cohortId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (cohort) setTargetSize(cohort.targetGroupSize);
  }, [cohort?.targetGroupSize]);

  // the organiser runs the split and isn't placed in a team, so leave them out of the counts
  const students = useMemo(
    () => (roster ?? []).filter((member) => member.id !== cohort?.createdBy),
    [roster, cohort?.createdBy]
  );
  const readyCount = useMemo(() => students.filter((member) => member.result).length, [students]);

  function runSplit() {
    if (!cohort || !roster) return;
    setSplitting(true);
    // yield a frame so the loading state shows before the (synchronous) search blocks
    setTimeout(() => {
      setOutcome(planCohortFormation(cohort, roster, targetSize, cohort.createdBy));
      setSplitting(false);
    }, 16);
  }

  async function removeCohort() {
    if (!cohort) return;
    try {
      setDeleting(true);
      setDeleteError('');
      // the cohort drops out of state before we navigate, so flag it first or
      // the "not found" screen flashes on the way out
      setRemoved(true);
      await deleteCohort(cohort.id);
      setConfirmDelete(false);
      router.replace('/(tabs)/cohort');
    } catch (err) {
      setRemoved(false);
      setDeleteError(err instanceof Error ? err.message : 'Could not delete this cohort.');
    } finally {
      setDeleting(false);
    }
  }

  async function shareCohortInvite() {
    if (!cohort) return;
    const url = Linking.createURL(buildInvitePath(cohort.joinCode));
    const message = `Join the "${cohort.name}" cohort on KyodoAI: ${url}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        setNotice('Cohort invite copied to your clipboard.');
        return;
      }
      await Share.share({ message });
    } catch {
      setNotice(`Share this link: ${url}`);
    }
  }

  if (!cohort) {
    if (removed) {
      return (
        <Screen>
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        </Screen>
      );
    }

    return (
      <Screen>
        <Text style={styles.title}>Cohort not found</Text>
        <Text style={styles.body}>
          {error || 'This cohort may have been removed, or you may no longer be a member.'}
        </Text>
        <AppButton title="Back to cohorts" onPress={() => router.replace('/(tabs)/cohort')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to cohorts"
        onPress={() => router.replace('/(tabs)/cohort')}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={18} color={colors.accentDark} />
        <Text style={styles.backText}>Cohort</Text>
      </Pressable>

      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{cohort.isOrganiser ? 'YOU ORGANISE THIS COHORT' : 'COHORT'}</Text>
          <Text style={styles.title}>{cohort.name}</Text>
          {cohort.description ? <Text style={styles.body}>{cohort.description}</Text> : null}
        </View>
        <View style={styles.codePill}>
          <Text style={styles.codeLabel}>CODE</Text>
          <Text selectable style={styles.codeValue}>{cohort.joinCode}</Text>
        </View>
      </View>

      {cohort.isOrganiser ? (
        <View style={styles.actionRow}>
          <View style={styles.actionSlot}>
            <AppButton title="Invite students" variant="secondary" onPress={() => void shareCohortInvite()} />
          </View>
          <View style={styles.actionSlot}>
            <AppButton title="Edit cohort" variant="secondary" onPress={() => setFormMode('edit')} />
          </View>
        </View>
      ) : (
        <AppButton title="Invite students" variant="secondary" onPress={() => void shareCohortInvite()} />
      )}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.statRow}>
        <Stat label="Students" value={String(students.length)} />
        <Stat label="Profiles ready" value={`${readyCount}/${students.length}`} />
        <Stat label="Target size" value={String(targetSize)} />
      </View>

      {roster === null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.body}>Loading roster…</Text>
        </View>
      ) : (
        <>
          {cohort.isOrganiser ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Target team size</Text>
              <TargetSizeStepper
                value={targetSize}
                max={Math.max(2, students.length)}
                onChange={(size) => {
                  setTargetSize(size);
                  setOutcome(null);
                  void setCohortTargetSize(cohort.id, size).catch(() => undefined);
                }}
              />
              <AppButton title="Suggest groups" loading={splitting} onPress={runSplit} />
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>You are a student in this cohort</Text>
              <Text style={styles.body}>
                Your organiser runs the group split. Make sure your work-style profile and availability are complete so
                you are included.
              </Text>
            </View>
          )}

          {outcome?.status === 'blocked' ? (
            <View style={[styles.card, styles.cardWarn]}>
              <Text style={styles.cardTitle}>Cannot suggest groups yet</Text>
              <Text style={styles.body}>{outcome.reason}</Text>
              {outcome.pendingNames.length ? (
                <Text style={styles.pending}>Waiting on: {outcome.pendingNames.slice(0, 6).join(', ')}</Text>
              ) : null}
            </View>
          ) : null}

          {outcome?.status === 'ok' ? <SplitReport outcome={outcome} /> : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Roster</Text>
            {roster.length ? (
              roster.map((member) => {
                const isOrganiser = member.id === cohort.createdBy;
                return (
                  <View key={member.id} style={styles.rosterRow}>
                    <Text numberOfLines={1} style={styles.rosterName}>{member.name}</Text>
                    <View style={styles.rosterTags}>
                      {isOrganiser ? (
                        <View style={[styles.tag, styles.tagReady]}>
                          <Text style={[styles.tagText, styles.tagTextReady]}>Organiser</Text>
                        </View>
                      ) : (
                        <>
                          {member.availability?.length ? (
                            <View style={styles.tag}>
                              <Text style={styles.tagText}>Availability</Text>
                            </View>
                          ) : null}
                          <View style={[styles.tag, member.result && styles.tagReady]}>
                            <Text style={[styles.tagText, member.result && styles.tagTextReady]}>
                              {member.result ? 'Profile ready' : 'Pending'}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.body}>No students have joined yet. Share the cohort code to get started.</Text>
            )}
          </View>

          {cohort.isOrganiser ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete the ${cohort.name} cohort`}
              onPress={() => {
                setDeleteError('');
                setConfirmDelete(true);
              }}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
            >
              <Ionicons name="trash-outline" size={17} color={colors.error} />
              <Text style={styles.deleteText}>Delete this cohort</Text>
            </Pressable>
          ) : null}
        </>
      )}

      <CohortFormModal mode={formMode} cohort={cohort} onClose={() => setFormMode(null)} />
      <ConfirmModal
        visible={confirmDelete}
        icon="trash-outline"
        title="Delete this cohort?"
        body={
          <>
            {cohort.name} and its roster of {cohort.memberCount}{' '}
            {cohort.memberCount === 1 ? 'member' : 'members'} will be removed for everyone, and the code{' '}
            {cohort.joinCode} will stop working. This cannot be undone.
          </>
        }
        confirmLabel="Delete cohort"
        loadingLabel="Deleting…"
        tone="danger"
        loading={deleting}
        error={deleteError}
        cancelAccessibilityLabel="Cancel deleting this cohort"
        onClose={() => {
          if (!deleting) setConfirmDelete(false);
        }}
        onConfirm={() => void removeCohort()}
      />
    </Screen>
  );
}

function SplitReport({ outcome }: { outcome: Extract<CohortFormationOutcome, { status: 'ok' }> }) {
  const { result } = outcome;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Suggested groups</Text>
      <Text style={styles.body}>
        {result.scoreLabel} · around {scoreRange(result.overallScore)} · {result.groups.length} groups of{' '}
        {result.groupSizes.join(' / ')}
      </Text>
      <Text style={styles.method}>
        Checked {result.evaluatedGroupings.toLocaleString()} possible groupings exactly across {result.readyCount}{' '}
        students.
      </Text>
      {result.pendingNames.length ? (
        <Text style={styles.pending}>
          Not placed ({result.pendingNames.length}): {result.pendingNames.slice(0, 6).join(', ')} (no completed
          profile yet).
        </Text>
      ) : null}

      {result.groups.map((group, index) => (
        <View key={group.id} style={styles.groupCard}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>Group {index + 1} · {group.members.length}</Text>
            <Text style={styles.groupScore}>{describeScoreBand(group.score).label}</Text>
          </View>
          <Text style={styles.groupMembers}>{group.members.join(', ')}</Text>
          {group.suggestedCoordinator ? <Text style={styles.groupNote}>{group.suggestedCoordinator}</Text> : null}
          <Text style={styles.groupAvailability}>{group.availabilityNote}</Text>
        </View>
      ))}

      <Text style={styles.caveat}>{scoreCaveat}</Text>
      <Text style={styles.futureNote}>
        Publishing these groups as real teams is not built yet. Share them with your class, and students can create
        teams with the names above.
      </Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 36, alignSelf: 'flex-start' },
  backText: { color: colors.accentDark, fontSize: 14, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 4 },
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
  codePill: { alignItems: 'center', backgroundColor: colors.accentSoft, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  codeLabel: { color: colors.textSecondary, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  codeValue: { color: colors.accentDark, fontSize: 15, fontWeight: '900', letterSpacing: 1.2, marginTop: 2 },
  notice: { color: colors.accentDark, fontSize: 12, lineHeight: 17 },
  error: { color: colors.error, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionSlot: { flex: 1 },
  statRow: { flexDirection: 'row', gap: 8 },
  deleteButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7
  },
  deleteText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  stat: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 11 },
  statValue: { color: colors.accentDark, fontSize: 18, fontWeight: '900' },
  statLabel: { color: colors.textSecondary, fontSize: 9, fontWeight: '800', marginTop: 3 },
  loading: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  card: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 15, gap: 10 },
  cardWarn: { backgroundColor: '#FFF8E6', borderColor: '#F0E2BC' },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  method: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  pending: { color: '#8A6D1F', fontSize: 11, lineHeight: 16 },
  groupCard: { borderRadius: 12, backgroundColor: '#F8FCFA', borderWidth: 1, borderColor: '#E7EFEA', padding: 12, gap: 5 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  groupTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  groupScore: { color: colors.accentDark, fontSize: 13, fontWeight: '900' },
  groupMembers: { color: colors.textPrimary, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  groupNote: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  groupAvailability: { color: colors.accentDark, fontSize: 11, lineHeight: 16 },
  caveat: { color: colors.textSecondary, fontSize: 10, lineHeight: 15, fontStyle: 'italic' },
  futureNote: { color: colors.textSecondary, fontSize: 10, lineHeight: 15 },
  rosterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36 },
  rosterName: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  rosterTags: { flexDirection: 'row', gap: 6 },
  tag: { borderRadius: 99, backgroundColor: '#F1F2F1', paddingHorizontal: 8, paddingVertical: 4 },
  tagReady: { backgroundColor: colors.accentSoft },
  tagText: { color: '#777F7A', fontSize: 9, fontWeight: '700' },
  tagTextReady: { color: colors.accentDark },
  pressed: { opacity: 0.72 }
});
