import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui';
import { CompatibilityResult, Team } from '@/types/domain';

const palette = {
  surface: '#FFFFFF',
  text: '#171C19',
  secondary: '#5A635E',
  border: '#E1E9E4',
  accent: '#15906A',
  accentDark: '#087453',
  accentSoft: '#DDF2E9',
  error: '#B9483D'
};

const avatarColors = ['#F0B1A7', '#F2C985', '#A8D9C3', '#BFC9EC', '#DAB8E7'];

export function TeamDetails({
  team,
  compatibility,
  canGenerateCompatibility,
  insightsLoading,
  onGenerateInsights,
  onLeave
}: {
  team: Team;
  compatibility?: CompatibilityResult;
  canGenerateCompatibility: boolean;
  insightsLoading: boolean;
  onGenerateInsights: () => void;
  onLeave: () => void;
}) {
  return (
    <View style={styles.detailsCard}>
      <View style={styles.detailsHeader}>
        <View style={styles.detailsTitleCopy}>
          <Text style={styles.detailsEyebrow}>ACTIVE TEAM</Text>
          <Text style={styles.detailsTitle}>{team.name}</Text>
        </View>
        <View style={styles.codePill}>
          <Text style={styles.codeLabel}>CODE</Text>
          <Text selectable style={styles.codeValue}>{team.joinCode}</Text>
        </View>
      </View>

      {team.projectName ? <Text style={styles.projectName}>{team.projectName}</Text> : null}
      {team.description ? <Text style={styles.description}>{team.description}</Text> : null}

      <View style={styles.divider} />
      <Text style={styles.memberHeading}>Members</Text>
      <View style={styles.memberList}>
        {team.members.map((member, index) => (
          <View key={member.id} style={styles.memberItem}>
            <View style={[styles.avatar, { backgroundColor: avatarColors[index % avatarColors.length] }]}>
              <Text style={styles.avatarText}>{member.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.memberCopy}>
              <Text numberOfLines={1} style={styles.memberName}>{member.name}</Text>
              <Text numberOfLines={1} style={styles.memberRole}>{member.role || 'Member'}</Text>
            </View>
            <View style={[styles.profileStatus, member.result && styles.profileStatusComplete]}>
              <Text style={[styles.profileStatusText, member.result && styles.profileStatusTextComplete]}>
                {member.result ? 'Profile ready' : 'Profile pending'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <View style={styles.insightIcon}>
            <Ionicons name="sparkles" size={18} color={palette.accentDark} />
          </View>
          <View style={styles.insightCopy}>
            <Text style={styles.insightTitle}>Compatibility insights</Text>
            <Text style={styles.insightBody}>
              {compatibility
                ? `${compatibility.score}% · ${compatibility.scoreLabel}`
                : canGenerateCompatibility
                  ? 'Your team profiles are ready to compare.'
                  : 'Available when at least two work-style profiles are ready.'}
            </Text>
          </View>
        </View>
        {compatibility?.strengths[0] ? <Text style={styles.insightStrength}>{compatibility.strengths[0]}</Text> : null}
        {canGenerateCompatibility ? (
          <AppButton
            title={compatibility ? 'Refresh insights' : 'Generate insights'}
            variant="secondary"
            loading={insightsLoading}
            onPress={onGenerateInsights}
          />
        ) : null}
      </View>

      <Pressable onPress={onLeave} style={({ pressed }) => [styles.leaveButton, pressed && styles.pressed]}>
        <Ionicons name="exit-outline" size={18} color={palette.error} />
        <Text style={styles.leaveText}>Leave this team</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  detailsCard: {
    backgroundColor: palette.surface,
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
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12
  },
  detailsTitleCopy: { flex: 1 },
  detailsEyebrow: { color: palette.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  detailsTitle: { color: palette.text, fontSize: 22, fontWeight: '900', marginTop: 4 },
  codePill: {
    alignItems: 'center',
    backgroundColor: palette.accentSoft,
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  codeLabel: { color: palette.secondary, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  codeValue: { color: palette.accentDark, fontSize: 14, fontWeight: '900', letterSpacing: 1.2, marginTop: 2 },
  projectName: { color: palette.accentDark, fontSize: 14, fontWeight: '700', marginTop: 12 },
  description: { color: palette.secondary, fontSize: 14, lineHeight: 21, marginTop: 5 },
  divider: { height: 1, backgroundColor: palette.border, marginVertical: 17 },
  memberHeading: { color: palette.text, fontSize: 15, fontWeight: '800', marginBottom: 11 },
  memberList: { gap: 12 },
  memberItem: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: '#17392F', fontSize: 13, fontWeight: '900' },
  memberCopy: { flex: 1, paddingRight: 8 },
  memberName: { color: palette.text, fontSize: 14, fontWeight: '700' },
  memberRole: { color: palette.secondary, fontSize: 11, marginTop: 3 },
  profileStatus: { borderRadius: 99, backgroundColor: '#F1F2F1', paddingHorizontal: 8, paddingVertical: 5 },
  profileStatusComplete: { backgroundColor: palette.accentSoft },
  profileStatusText: { color: '#777F7A', fontSize: 9, fontWeight: '700' },
  profileStatusTextComplete: { color: palette.accentDark },
  insightCard: { backgroundColor: '#F5FAF7', borderRadius: 13, padding: 14, marginTop: 20, gap: 12 },
  insightHeader: { flexDirection: 'row', alignItems: 'center' },
  insightIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
    marginRight: 10
  },
  insightCopy: { flex: 1 },
  insightTitle: { color: palette.text, fontSize: 14, fontWeight: '800' },
  insightBody: { color: palette.secondary, fontSize: 11, lineHeight: 16, marginTop: 3 },
  insightStrength: { color: palette.secondary, fontSize: 12, lineHeight: 18 },
  leaveButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10
  },
  leaveText: { color: palette.error, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] }
});
