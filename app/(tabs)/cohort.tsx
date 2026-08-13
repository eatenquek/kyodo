import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, layout, typography } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui';
import { CohortFormModal, CohortFormMode } from '@/components/cohorts/CohortFormModal';
import { useAppState } from '@/lib/appState';
import { universityLogos } from '@/constants/universities';

export default function CohortScreen() {
  const { cohorts, loadCohorts } = useAppState();
  const [cohortMode, setCohortMode] = useState<CohortFormMode>(null);

  const loadCohortsRef = useRef(loadCohorts);
  loadCohortsRef.current = loadCohorts;
  useFocusEffect(
    useCallback(() => {
      void loadCohortsRef.current();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.backgroundGlow} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Cohort</Text>
        </View>

        <View style={styles.introCard}>
          <View style={styles.introCopy}>
            <Text style={styles.introTitle}>Split a class into teams.</Text>
            <Text style={styles.introBody}>
              An organiser creates a cohort, students join with a code, and it splits into balanced teams in one go.
            </Text>
          </View>
          <View style={styles.introIcon}>
            <Ionicons name="school" size={34} color={colors.accentDark} />
          </View>
        </View>

        <View style={styles.quickActions}>
          <View style={styles.actionSlot}>
            <AppButton title="Create cohort" onPress={() => setCohortMode('create')} />
          </View>
          <View style={styles.actionSlot}>
            <AppButton title="Join cohort" variant="secondary" onPress={() => setCohortMode('join')} />
          </View>
        </View>

        {cohorts.length ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your cohorts</Text>
              <Text style={styles.sectionCount}>{cohorts.length}</Text>
            </View>
            {cohorts.map((cohort) => (
              <Pressable
                key={cohort.id}
                accessibilityRole="button"
                accessibilityLabel={`Open cohort ${cohort.name}`}
                onPress={() => router.push(`/cohort/${cohort.id}`)}
                style={({ pressed }) => [styles.cohortCard, pressed && styles.pressed]}
              >
                <View style={styles.cohortBadge}>
                  {cohort.school && universityLogos[cohort.school] ? (
                    <Image source={universityLogos[cohort.school]} style={styles.cohortLogo} resizeMode="contain" />
                  ) : (
                    <Ionicons name="school-outline" size={22} color={colors.accentDark} />
                  )}
                </View>
                <View style={styles.cohortCopy}>
                  <Text numberOfLines={1} style={styles.cohortName}>{cohort.name}</Text>
                  <Text numberOfLines={1} style={styles.cohortMeta}>
                    {cohort.isOrganiser ? 'You organise' : 'Student'} · {cohort.memberCount}{' '}
                    {cohort.memberCount === 1 ? 'student' : 'students'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={21} color={colors.iconMuted} />
              </Pressable>
            ))}
          </>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="school-outline" size={31} color={colors.accentDark} />
            </View>
            <Text style={styles.emptyTitle}>No cohorts yet</Text>
            <Text style={styles.emptyBody}>
              Organising a class? Create a cohort. A student? Join with the code your tutor shares.
            </Text>
          </View>
        )}
      </ScrollView>
      <CohortFormModal mode={cohortMode} onClose={() => setCohortMode(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  backgroundGlow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    top: -110,
    right: -115,
    backgroundColor: colors.glow
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.gutter,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 16
  },
  pageHeader: { minHeight: 44, justifyContent: 'center', marginBottom: 10 },
  pageTitle: { color: colors.textPrimary, fontSize: typography.pageTitle, fontWeight: '800', letterSpacing: -0.6 },
  introCard: {
    minHeight: 118,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 18,
    padding: 18
  },
  introCopy: { flex: 1, paddingRight: 12 },
  introTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  introBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 },
  introIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)'
  },
  quickActions: { flexDirection: 'row', gap: 10 },
  actionSlot: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  sectionCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 24,
    color: colors.accentDark,
    backgroundColor: colors.accentSoft,
    fontSize: 12,
    fontWeight: '800'
  },
  cohortCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  cohortLogo: { width: 30, height: 30 },
  cohortBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    marginRight: 12
  },
  cohortCopy: { flex: 1, paddingRight: 8 },
  cohortName: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  cohortMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 5 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 25,
    paddingVertical: 32
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    marginBottom: 14
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '800' },
  emptyBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] }
});
