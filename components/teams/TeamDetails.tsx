import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui';
import { suggestBestTeamFormation, TeamFormationSuggestion } from '@/services/scoring/teamFormation';
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
  const completedProfileCount = team.members.filter((member) => member.result).length;
  const groupSizeOptions = useMemo(() => getGroupSizeOptions(completedProfileCount), [completedProfileCount]);
  const [targetGroupSize, setTargetGroupSize] = useState(3);
  const effectiveTargetGroupSize = groupSizeOptions.includes(targetGroupSize)
    ? targetGroupSize
    : groupSizeOptions[0] ?? 3;
  const formationSuggestion = useMemo(
    () => suggestBestTeamFormation(team, effectiveTargetGroupSize),
    [effectiveTargetGroupSize, team]
  );
  const showFormationCard = completedProfileCount >= 4;

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
        {compatibility ? (
          <View style={styles.compatibilityReport}>
            <View style={styles.metricGrid}>
              <Metric label="Pair fit" value={compatibility.pairFitScore ?? compatibility.score} />
              <Metric label="Role coverage" value={compatibility.roleCoverageScore ?? compatibility.score} />
              <Metric label="Coordination" value={compatibility.coordinatorHealthScore ?? compatibility.score} />
            </View>

            {compatibility.suggestedCoordinator ? (
              <View style={styles.coordinatorCallout}>
                <Ionicons name="flag-outline" size={15} color={palette.accentDark} />
                <Text style={styles.coordinatorText}>{compatibility.suggestedCoordinator}</Text>
              </View>
            ) : null}

            {compatibility.roleCoverage?.length ? (
              <View style={styles.roleGrid}>
                {compatibility.roleCoverage.map((role) => (
                  <View key={role.id} style={styles.roleCard}>
                    <View style={styles.roleHeader}>
                      <Text style={styles.roleLabel}>{role.label}</Text>
                      <Text style={styles.roleScore}>{role.score}%</Text>
                    </View>
                    <Text style={styles.roleMembers} numberOfLines={2}>{role.members.join(', ')}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <InsightSection title="Strengths" items={compatibility.strengths} />
            <InsightSection title="Watch-outs" items={[...(compatibility.gaps ?? []), ...(compatibility.overlapRisks ?? []), ...compatibility.frictions]} />
            <InsightSection title="Next steps" items={compatibility.tips} />
          </View>
        ) : null}
        {canGenerateCompatibility ? (
          <AppButton
            title={compatibility ? 'Refresh insights' : 'Generate insights'}
            variant="secondary"
            loading={insightsLoading}
            onPress={onGenerateInsights}
          />
        ) : null}
      </View>

      {showFormationCard ? (
        <FormationCard
          suggestion={formationSuggestion}
          completedProfileCount={completedProfileCount}
          totalMemberCount={team.members.length}
          targetGroupSize={effectiveTargetGroupSize}
          groupSizeOptions={groupSizeOptions}
          onTargetGroupSizeChange={setTargetGroupSize}
        />
      ) : null}

      <Pressable onPress={onLeave} style={({ pressed }) => [styles.leaveButton, pressed && styles.pressed]}>
        <Ionicons name="exit-outline" size={18} color={palette.error} />
        <Text style={styles.leaveText}>Leave this team</Text>
      </Pressable>
    </View>
  );
}

function FormationCard({
  suggestion,
  completedProfileCount,
  totalMemberCount,
  targetGroupSize,
  groupSizeOptions,
  onTargetGroupSizeChange
}: {
  suggestion: TeamFormationSuggestion | null;
  completedProfileCount: number;
  totalMemberCount: number;
  targetGroupSize: number;
  groupSizeOptions: number[];
  onTargetGroupSizeChange: (size: number) => void;
}) {
  return (
    <View style={styles.formationCard}>
      <View style={styles.formationHeader}>
        <View style={styles.formationIcon}>
          <Ionicons name="git-network-outline" size={18} color={palette.accentDark} />
        </View>
        <View style={styles.formationCopy}>
          <Text style={styles.formationTitle}>Best group split</Text>
          <Text style={styles.formationBody}>
            {suggestion
              ? `${suggestion.overallScore}% · ${suggestion.scoreLabel} · target ${suggestion.groupSize} per team.`
              : formationUnavailableText(completedProfileCount, totalMemberCount, targetGroupSize)}
          </Text>
        </View>
      </View>

      {groupSizeOptions.length ? (
        <View style={styles.groupSizePicker}>
          <Text style={styles.groupSizeLabel}>Target team size</Text>
          <View style={styles.groupSizeOptions}>
            {groupSizeOptions.map((size) => (
              <Pressable
                key={size}
                accessibilityRole="button"
                accessibilityState={{ selected: size === targetGroupSize }}
                onPress={() => onTargetGroupSizeChange(size)}
                style={({ pressed }) => [
                  styles.groupSizeChip,
                  size === targetGroupSize && styles.groupSizeChipActive,
                  pressed && styles.pressed
                ]}
              >
                <Text style={[styles.groupSizeChipText, size === targetGroupSize && styles.groupSizeChipTextActive]}>
                  {size}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {suggestion ? (
        <View style={styles.formationReport}>
          <Text style={styles.formationSizes}>Actual split: {formatGroupSizes(suggestion.groupSizes)}</Text>
          <Text style={styles.formationMethod}>Checked {suggestion.evaluatedGroupings} possible groupings exactly.</Text>
          <View style={styles.metricGrid}>
            <Metric label="Average team" value={suggestion.averageTeamScore} />
            <Metric label="Weakest team" value={suggestion.weakestTeamScore} />
            <Metric label="Balance" value={suggestion.balanceScore} />
          </View>

          {suggestion.groups.map((group, index) => (
            <View key={group.id} style={styles.suggestedGroupCard}>
              <View style={styles.suggestedGroupHeader}>
                <Text style={styles.suggestedGroupTitle}>
                  Team {index + 1} · {group.members.length}
                </Text>
                <Text style={styles.suggestedGroupScore}>{group.score}%</Text>
              </View>
              <Text style={styles.suggestedGroupMembers}>{group.members.join(', ')}</Text>
              {group.suggestedCoordinator ? (
                <Text style={styles.suggestedGroupNote}>{group.suggestedCoordinator}</Text>
              ) : null}
              {group.strengths[0] ? <Text style={styles.suggestedGroupStrength}>{group.strengths[0]}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function getGroupSizeOptions(completedProfileCount: number) {
  if (completedProfileCount < 4) return [];
  const maxSize = completedProfileCount - 2;
  return Array.from({ length: maxSize - 1 }, (_, index) => index + 2);
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}%</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function formationUnavailableText(completedProfileCount: number, totalMemberCount: number, targetGroupSize: number) {
  if (completedProfileCount !== totalMemberCount) {
    return `${completedProfileCount}/${totalMemberCount} profiles are ready. Everyone needs a completed profile first.`;
  }
  if (targetGroupSize > completedProfileCount - 2) {
    return `Choose a smaller target size so there can be at least two teams.`;
  }
  return 'This pool is too large for exact search on-device. Split into smaller pools first.';
}

function formatGroupSizes(groupSizes: number[]) {
  return [...groupSizes].sort((a, b) => b - a).join(' / ');
}

function InsightSection({ title, items }: { title: string; items: string[] }) {
  const uniqueItems = [...new Set(items)].slice(0, 3);
  if (!uniqueItems.length) return null;

  return (
    <View style={styles.insightSection}>
      <Text style={styles.insightSectionTitle}>{title}</Text>
      {uniqueItems.map((item) => (
        <View key={item} style={styles.insightBulletRow}>
          <View style={styles.insightBullet} />
          <Text style={styles.insightBulletText}>{item}</Text>
        </View>
      ))}
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
  compatibilityReport: { gap: 12 },
  metricGrid: { flexDirection: 'row', gap: 8 },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  metricValue: { color: palette.accentDark, fontSize: 17, fontWeight: '900' },
  metricLabel: { color: palette.secondary, fontSize: 9, fontWeight: '800', marginTop: 2 },
  coordinatorCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    backgroundColor: palette.accentSoft,
    padding: 10
  },
  coordinatorText: { flex: 1, color: palette.accentDark, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  roleGrid: { gap: 8 },
  roleCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#FFFFFF',
    padding: 10
  },
  roleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  roleLabel: { color: palette.text, fontSize: 12, fontWeight: '800' },
  roleScore: { color: palette.accentDark, fontSize: 12, fontWeight: '900' },
  roleMembers: { color: palette.secondary, fontSize: 11, lineHeight: 16, marginTop: 4 },
  insightSection: { gap: 7 },
  insightSectionTitle: { color: palette.text, fontSize: 12, fontWeight: '900' },
  insightBulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  insightBullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.accent, marginTop: 6 },
  insightBulletText: { flex: 1, color: palette.secondary, fontSize: 12, lineHeight: 18 },
  formationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    marginTop: 12,
    gap: 12
  },
  formationHeader: { flexDirection: 'row', alignItems: 'center' },
  formationIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
    marginRight: 10
  },
  formationCopy: { flex: 1 },
  formationTitle: { color: palette.text, fontSize: 14, fontWeight: '800' },
  formationBody: { color: palette.secondary, fontSize: 11, lineHeight: 16, marginTop: 3 },
  formationReport: { gap: 10 },
  groupSizePicker: { gap: 8 },
  groupSizeLabel: { color: palette.text, fontSize: 12, fontWeight: '900' },
  groupSizeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  groupSizeChip: {
    minWidth: 34,
    minHeight: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10
  },
  groupSizeChipActive: {
    borderColor: palette.accent,
    backgroundColor: palette.accent
  },
  groupSizeChipText: { color: palette.secondary, fontSize: 12, fontWeight: '900' },
  groupSizeChipTextActive: { color: '#FFFFFF' },
  formationSizes: { color: palette.text, fontSize: 12, fontWeight: '800' },
  formationMethod: { color: palette.secondary, fontSize: 10, lineHeight: 15 },
  suggestedGroupCard: {
    borderRadius: 12,
    backgroundColor: '#F8FCFA',
    borderWidth: 1,
    borderColor: '#E7EFEA',
    padding: 11
  },
  suggestedGroupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  suggestedGroupTitle: { color: palette.text, fontSize: 13, fontWeight: '900' },
  suggestedGroupScore: { color: palette.accentDark, fontSize: 13, fontWeight: '900' },
  suggestedGroupMembers: { color: palette.text, fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 5 },
  suggestedGroupNote: { color: palette.secondary, fontSize: 11, lineHeight: 16, marginTop: 6 },
  suggestedGroupStrength: { color: palette.accentDark, fontSize: 11, fontWeight: '700', lineHeight: 16, marginTop: 6 },
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
