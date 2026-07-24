import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui';
import { CohortFormModal, CohortFormMode } from '@/components/cohorts/CohortFormModal';
import { useAppState } from '@/lib/appState';

const palette = {
  background: '#FBFCFA',
  surface: '#FFFFFF',
  text: '#171C19',
  secondary: '#5A635E',
  border: '#E1E9E4',
  accent: '#15906A',
  accentDark: '#087453',
  accentSoft: '#DDF2E9'
};

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
            <Text style={styles.eyebrow}>FOR CLASSES & TUTORIALS</Text>
            <Text style={styles.introTitle}>Split a class into teams.</Text>
            <Text style={styles.introBody}>
              An organiser creates a cohort, students join with a code, and it splits into balanced teams in one go.
            </Text>
          </View>
          <View style={styles.introIcon}>
            <Ionicons name="school" size={34} color={palette.accentDark} />
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
                  <Ionicons name="school-outline" size={22} color={palette.accentDark} />
                </View>
                <View style={styles.cohortCopy}>
                  <Text numberOfLines={1} style={styles.cohortName}>{cohort.name}</Text>
                  <Text numberOfLines={1} style={styles.cohortMeta}>
                    {cohort.isOrganiser ? 'You organise' : 'Student'} · {cohort.memberCount}{' '}
                    {cohort.memberCount === 1 ? 'student' : 'students'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={21} color="#9BA29E" />
              </Pressable>
            ))}
          </>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="school-outline" size={31} color={palette.accentDark} />
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
  safeArea: { flex: 1, backgroundColor: palette.background },
  backgroundGlow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    top: -110,
    right: -115,
    backgroundColor: '#F0F8F3'
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 16
  },
  pageHeader: { minHeight: 44, justifyContent: 'center', marginBottom: 10 },
  pageTitle: { color: palette.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  introCard: {
    minHeight: 118,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.accentSoft,
    borderRadius: 18,
    padding: 18
  },
  introCopy: { flex: 1, paddingRight: 12 },
  eyebrow: { color: palette.accentDark, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  introTitle: { color: palette.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginTop: 5 },
  introBody: { color: palette.secondary, fontSize: 13, lineHeight: 19, marginTop: 6 },
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
  sectionTitle: { color: palette.text, fontSize: 18, fontWeight: '800' },
  sectionCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 24,
    color: palette.accentDark,
    backgroundColor: palette.accentSoft,
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
    borderColor: palette.border,
    backgroundColor: palette.surface
  },
  cohortBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
    marginRight: 12
  },
  cohortCopy: { flex: 1, paddingRight: 8 },
  cohortName: { color: palette.text, fontSize: 16, fontWeight: '800' },
  cohortMeta: { color: palette.secondary, fontSize: 12, marginTop: 5 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 25,
    paddingVertical: 32
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
    marginBottom: 14
  },
  emptyTitle: { color: palette.text, fontSize: 19, fontWeight: '800' },
  emptyBody: { color: palette.secondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] }
});
