import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, DimensionBar, PageHeader, Screen } from '@/components/ui';
import { ProfileFormModal } from '@/components/profile/ProfileFormModal';
import { dimensionLabels, questions } from '@/constants/questions';
import { colors } from '@/constants/theme';
import { useAppState } from '@/lib/appState';
import { Dimension } from '@/types/domain';

const resultDimensions: Dimension[] = ['planning', 'communication', 'leadership'];

export default function ProfileScreen() {
  const { answers, profile, result, signOut, user } = useAppState();
  const [editing, setEditing] = useState(false);
  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'KyodoAI member';
  const initial = displayName.slice(0, 1).toUpperCase();
  const answeredCount = questions.filter((question) => Boolean(answers[question.id])).length;
  const questionnaireAction = answeredCount
    ? `Resume questionnaire (${answeredCount}/${questions.length})`
    : 'Start questionnaire';
  const openQuestionnaire = () => router.push('/questionnaire');

  return (
    <>
      <Screen>
        <PageHeader
          title="Profile"
          action={
            <Pressable
              accessibilityLabel="Edit profile"
              hitSlop={10}
              onPress={() => setEditing(true)}
              style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
            >
              <Ionicons name="create-outline" size={20} color={colors.accentDark} />
            </Pressable>
          }
        />

        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.identityCopy}>
            <Text numberOfLines={1} style={styles.name}>{displayName}</Text>
            <Text numberOfLines={1} style={styles.email}>{user?.email || 'Local account'}</Text>
            <View style={[styles.statusPill, profile && styles.statusPillComplete]}>
              <Ionicons
                name={profile ? 'checkmark-circle' : 'time-outline'}
                size={13}
                color={profile ? colors.accentDark : colors.textSecondary}
              />
              <Text style={[styles.statusText, profile && styles.statusTextComplete]}>
                {profile ? 'Profile complete' : 'Complete your profile'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>About you</Text>
          <Pressable onPress={() => setEditing(true)} hitSlop={8}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <InfoRow icon="school-outline" label="University" value={profile?.university || 'Not added'} />
          <View style={styles.divider} />
          <InfoRow icon="book-outline" label="Course" value={profile?.course || 'Not added'} />
          <View style={styles.divider} />
          <InfoRow
            icon="calendar-outline"
            label="Year of study"
            value={profile?.yearOfStudy ? `Year ${profile.yearOfStudy}` : 'Not added'}
          />
          <View style={styles.divider} />
          <InfoRow icon="briefcase-outline" label="Preferred role" value={profile?.preferredRole || 'Flexible'} />
          {profile?.bio ? (
            <>
              <View style={styles.divider} />
              <View style={styles.bioRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={19} color={colors.accentDark} />
                <View style={styles.bioCopy}>
                  <Text style={styles.infoLabel}>Bio</Text>
                  <Text style={styles.bioText}>{profile.bio}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Work-style profile</Text>
        </View>

        {result ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIcon}>
                <Ionicons name="sparkles" size={21} color={colors.accentDark} />
              </View>
              <View style={styles.resultCopy}>
                <Text style={styles.resultEyebrow}>YOUR WORK STYLE</Text>
                <Text style={styles.resultTitle}>{result.resultLabel}</Text>
              </View>
            </View>
            <Text style={styles.resultSummary}>{result.summaryText}</Text>
            <View style={styles.dimensionList}>
              {resultDimensions.map((dimension) => (
                <DimensionBar
                  key={dimension}
                  label={dimensionLabels[dimension]}
                  score={result[dimension]}
                />
              ))}
            </View>
            <View style={styles.retakeAction}>
              <AppButton title="Retake questionnaire" variant="secondary" onPress={openQuestionnaire} />
            </View>
          </View>
        ) : (
          <View style={styles.emptyResultCard}>
            <View style={styles.emptyResultRow}>
              <View style={styles.emptyResultIcon}>
                <Ionicons name="analytics-outline" size={28} color={colors.accentDark} />
              </View>
              <View style={styles.emptyResultCopy}>
                <Text style={styles.emptyResultTitle}>No work-style result yet</Text>
                <Text style={styles.emptyResultBody}>Complete the questionnaire to discover your strongest work-style dimensions.</Text>
              </View>
            </View>
            <AppButton title={questionnaireAction} variant="secondary" onPress={openQuestionnaire} />
          </View>
        )}

        <AppButton title="Sign out" variant="tertiary" onPress={() => void signOut()} />
      </Screen>

      <ProfileFormModal visible={editing} profile={profile} onClose={() => setEditing(false)} />
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={19} color={colors.accentDark} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text numberOfLines={2} style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 18,
    padding: 18
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    marginRight: 15
  },
  avatarText: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  identityCopy: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 21, fontWeight: '900', letterSpacing: -0.4 },
  email: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 9
  },
  statusPillComplete: { backgroundColor: '#FFFFFF' },
  statusText: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  statusTextComplete: { color: colors.accentDark },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  editText: { color: colors.accentDark, fontSize: 13, fontWeight: '700' },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    marginRight: 11
  },
  infoCopy: { flex: 1 },
  infoLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  infoValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 13 },
  bioRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 8 },
  bioCopy: { flex: 1 },
  bioText: { color: colors.textPrimary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2EF',
    padding: 18,
    shadowColor: '#193C30',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center' },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    marginRight: 11
  },
  resultCopy: { flex: 1 },
  resultEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  resultTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 3 },
  resultSummary: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 14 },
  dimensionList: { gap: 15, marginTop: 18 },
  retakeAction: { marginTop: 14 },
  emptyResultCard: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 17,
    gap: 15
  },
  emptyResultRow: { flexDirection: 'row', alignItems: 'center' },
  emptyResultIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    marginRight: 13
  },
  emptyResultCopy: { flex: 1 },
  emptyResultTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  emptyResultBody: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 4 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] }
});
