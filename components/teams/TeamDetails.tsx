import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui';
import { generateTeamCoachAdvice, TeamCoachAdvice } from '@/services/ai/teamCoach';
import { buildTeamCoachPayload } from '@/services/ai/teamCoachPayload';
import { getCoachAvailability } from '@/services/ai/coachAvailability';
import { describeCoachError } from '@/services/ai/coachErrors';
import { suggestBestTeamFormation, TeamFormationSuggestion } from '@/services/scoring/teamFormation';
import { buildWorkstyleProfile } from '@/services/scoring/workstyleProfile';
import { buildInvitePath } from '@/services/teams/inviteLink';
import { describeScoreBand, scoreCaveat, scoreRange } from '@/services/scoring/scoreInterpretation';
import { CompatibilityResult, Team, TeamMember } from '@/types/domain';

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
  insightsError = '',
  canRotateJoinCode = false,
  rotating = false,
  rotateError = '',
  onRotateJoinCode,
  onGenerateInsights,
  onLeave
}: {
  team: Team;
  compatibility?: CompatibilityResult;
  canGenerateCompatibility: boolean;
  insightsLoading: boolean;
  insightsError?: string;
  canRotateJoinCode?: boolean;
  rotating?: boolean;
  rotateError?: string;
  onRotateJoinCode?: () => void;
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
  const coachAvailability = getCoachAvailability({
    memberCount: team.members.length,
    completedResultCount: completedProfileCount,
    hasCompatibility: Boolean(compatibility),
    hasFormation: Boolean(formationSuggestion)
  });
  const showFormationCard = completedProfileCount >= 4;
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [inviteNotice, setInviteNotice] = useState('');

  // copies to clipboard on web (no share sheet everywhere), uses native share otherwise
  async function shareInvite() {
    const url = Linking.createURL(buildInvitePath(team.joinCode));
    const message = `Join "${team.name}" on KyodoAI: ${url}`;

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        setInviteNotice('Invite link copied to your clipboard.');
        return;
      }
      await Share.share({ message });
      setInviteNotice('');
    } catch {
      setInviteNotice(`Share this link: ${url}`);
    }
  }
  const [coachAdvice, setCoachAdvice] = useState<TeamCoachAdvice | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState('');

  const coachSignature = useMemo(
    () =>
      buildTeamCoachPayload({
        team,
        compatibility,
        formation: formationSuggestion,
        targetGroupSize: effectiveTargetGroupSize,
        refresh: false
      }).cache.formationSignature,
    [team, compatibility, formationSuggestion, effectiveTargetGroupSize]
  );

  useEffect(() => {
    setCoachAdvice(null);
    setCoachError('');
  }, [coachSignature]);

  async function createCoachAdvice(refresh = false) {
    if (coachLoading) return;
    try {
      setCoachLoading(true);
      setCoachError('');
      const advice = await generateTeamCoachAdvice({
        team,
        compatibility,
        formation: formationSuggestion,
        targetGroupSize: effectiveTargetGroupSize,
        refresh
      });
      setCoachAdvice(advice);
    } catch (err) {
      setCoachError(describeCoachError(err));
    } finally {
      setCoachLoading(false);
    }
  }

  return (
    <View style={styles.detailsCard}>
      <View style={styles.detailsHeader}>
        <View style={styles.detailsTitleCopy}>
          <Text style={styles.detailsEyebrow}>ACTIVE TEAM</Text>
          <Text style={styles.detailsTitle}>{team.name}</Text>
        </View>
        <View style={styles.codeColumn}>
          <View style={styles.codePill}>
            <Text style={styles.codeLabel}>CODE</Text>
            <Text selectable style={styles.codeValue}>{team.joinCode}</Text>
          </View>
          {canRotateJoinCode ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Generate a new join code, which stops the current one working"
              disabled={rotating}
              onPress={onRotateJoinCode}
              style={({ pressed }) => [styles.rotateButton, pressed && styles.pressed]}
            >
              <Ionicons name="refresh" size={12} color={palette.accentDark} />
              <Text style={styles.rotateText}>{rotating ? 'Working…' : 'New code'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Share an invite link for ${team.name}`}
        onPress={() => void shareInvite()}
        style={({ pressed }) => [styles.inviteButton, pressed && styles.pressed]}
      >
        <Ionicons name="person-add-outline" size={15} color="#FFFFFF" />
        <Text style={styles.inviteText}>Invite teammates</Text>
      </Pressable>
      {inviteNotice ? <Text style={styles.inviteNotice}>{inviteNotice}</Text> : null}

      {rotateError ? <Text style={styles.rotateError}>{rotateError}</Text> : null}

      {team.projectName ? <Text style={styles.projectName}>{team.projectName}</Text> : null}
      {team.description ? <Text style={styles.description}>{team.description}</Text> : null}

      <View style={styles.divider} />
      <Text style={styles.memberHeading}>Members</Text>
      <Text style={styles.memberHint}>Tap a member with a ready profile to see how they prefer to work.</Text>
      <View style={styles.memberList}>
        {team.members.map((member, index) => (
          <MemberRow
            key={member.id}
            member={member}
            color={avatarColors[index % avatarColors.length]}
            expanded={expandedMemberId === member.id}
            onToggle={() => setExpandedMemberId((current) => (current === member.id ? null : member.id))}
          />
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
                ? `${compatibility.scoreLabel} · around ${scoreRange(compatibility.score)}`
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

            <ScoreCaveat />

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
                      <Text style={styles.roleScore}>{describeScoreBand(role.score).label}</Text>
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
        {insightsError ? <Text style={styles.aiCoachError}>{insightsError}</Text> : null}
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

      <AiCoachCard
        advice={coachAdvice}
        error={coachError}
        loading={coachLoading}
        canGenerate={coachAvailability.canGenerate}
        reason={coachAvailability.reason}
        onGenerate={() => void createCoachAdvice(Boolean(coachAdvice))}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Leave ${team.name}`}
        onPress={onLeave}
        style={({ pressed }) => [styles.leaveButton, pressed && styles.pressed]}
      >
        <Ionicons name="exit-outline" size={18} color={palette.error} />
        <Text style={styles.leaveText}>Leave this team</Text>
      </Pressable>
    </View>
  );
}

// shows the hedged notes, not raw scores
function MemberRow({
  member,
  color,
  expanded,
  onToggle
}: {
  member: TeamMember;
  color: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const workstyle = useMemo(() => (member.result ? buildWorkstyleProfile(member.result) : null), [member.result]);
  const initial = (member.name || 'Teammate').slice(0, 1).toUpperCase();

  const row = (
    <>
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{initial}</Text>
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
    </>
  );

  if (!workstyle) {
    return <View style={styles.memberItem}>{row}</View>;
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${member.name}, profile ready. ${expanded ? 'Hide' : 'Show'} work-style notes`}
        onPress={onToggle}
        style={({ pressed }) => [styles.memberItem, pressed && styles.pressed]}
      >
        {row}
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={palette.secondary}
          style={styles.memberChevron}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.memberDetail}>
          <Text style={styles.memberDetailTendency}>{workstyle.primary.label}</Text>
          <Text style={styles.memberDetailBody}>{workstyle.primary.description}</Text>
          <InsightSection title="What to know when working together" items={workstyle.teammateNotes} />
          <Text style={styles.memberDetailDisclaimer}>
            Flexible work-style signals from {member.name.split(' ')[0]}&apos;s own answers — not a personality rating.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function AiCoachCard({
  advice,
  error,
  loading,
  canGenerate,
  reason,
  onGenerate
}: {
  advice: TeamCoachAdvice | null;
  error: string;
  loading: boolean;
  canGenerate: boolean;
  reason: string;
  onGenerate: () => void;
}) {
  return (
    <View style={styles.aiCoachCard}>
      <View style={styles.formationHeader}>
        <View style={styles.aiCoachIcon}>
          <Ionicons name="chatbubbles-outline" size={18} color={palette.accentDark} />
        </View>
        <View style={styles.formationCopy}>
          <Text style={styles.formationTitle}>Kyodo</Text>
        </View>
      </View>

      {error ? <Text style={styles.aiCoachError}>{error}</Text> : null}

      {advice ? (
        <View style={styles.aiCoachReport}>
          <Text style={styles.aiCoachSummary}>{advice.summary}</Text>
          <InsightSection title="Persona simulation" items={advice.simulation} />
          <InsightSection title="Coach notes" items={advice.coachingNotes} />
          <RoleSuggestionSection items={advice.roleSuggestions} />
          <InsightSection title="Risks to prevent" items={advice.riskWarnings} />
          <InsightSection title="Working agreement" items={advice.workingAgreement} />
          <InsightSection title="First meeting plan" items={advice.firstMeetingPlan} />
        </View>
      ) : null}

      {reason ? <Text style={styles.aiCoachHint}>{reason}</Text> : null}

      <AppButton
        title={advice ? 'Refresh' : 'Ask Kyodo'}
        variant="secondary"
        loading={loading}
        disabled={!canGenerate || loading}
        onPress={onGenerate}
      />
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
              ? `${suggestion.scoreLabel} · around ${scoreRange(suggestion.overallScore)} · target ${suggestion.groupSize} per team.`
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
                <Text style={styles.suggestedGroupScore}>{describeScoreBand(group.score).label}</Text>
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

function RoleSuggestionSection({ items }: { items: TeamCoachAdvice['roleSuggestions'] }) {
  if (!items.length) return null;

  return (
    <View style={styles.insightSection}>
      <Text style={styles.insightSectionTitle}>Suggested roles</Text>
      {items.slice(0, 5).map((item) => (
        <View key={`${item.member}-${item.role}`} style={styles.roleSuggestionCard}>
          <Text style={styles.roleSuggestionTitle}>{item.member} · {item.role}</Text>
          <Text style={styles.roleSuggestionBody}>{item.reason}</Text>
        </View>
      ))}
    </View>
  );
}

function getGroupSizeOptions(completedProfileCount: number) {
  if (completedProfileCount < 4) return [];
  const maxSize = completedProfileCount - 2;
  return Array.from({ length: maxSize - 1 }, (_, index) => index + 2);
}

// band + range instead of a raw number
function Metric({ label, value }: { label: string; value: number }) {
  const band = describeScoreBand(value);

  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricBand, band.id === 'watch' && styles.metricBandWatch]}>{band.label}</Text>
      <Text style={styles.metricRange}>{scoreRange(value)}</Text>
    </View>
  );
}

function ScoreCaveat() {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="How to read these scores"
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [styles.caveatToggle, pressed && styles.pressed]}
      >
        <Ionicons name="information-circle-outline" size={14} color={palette.secondary} />
        <Text style={styles.caveatToggleText}>How to read these scores</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={13} color={palette.secondary} />
      </Pressable>
      {open ? <Text style={styles.caveatBody}>{scoreCaveat}</Text> : null}
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
  codeColumn: { alignItems: 'flex-end', gap: 6 },
  inviteButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 99,
    backgroundColor: palette.accent,
    marginTop: 14
  },
  inviteText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  inviteNotice: { color: palette.accentDark, fontSize: 11, lineHeight: 16, marginTop: 8, textAlign: 'center' },
  rotateButton: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 30, paddingHorizontal: 4 },
  rotateText: { color: palette.accentDark, fontSize: 11, fontWeight: '800' },
  rotateError: { color: palette.error, fontSize: 11, fontWeight: '700', lineHeight: 16, marginTop: 8 },
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
  memberHeading: { color: palette.text, fontSize: 15, fontWeight: '800' },
  memberHint: { color: palette.secondary, fontSize: 11, lineHeight: 16, marginTop: 3, marginBottom: 11 },
  memberList: { gap: 12 },
  memberItem: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  memberChevron: { marginLeft: 8 },
  memberDetail: {
    gap: 9,
    borderRadius: 12,
    backgroundColor: '#F8FCFA',
    borderWidth: 1,
    borderColor: '#E7EFEA',
    padding: 12,
    marginTop: 9
  },
  memberDetailTendency: { color: palette.accentDark, fontSize: 12, fontWeight: '900' },
  memberDetailBody: { color: palette.secondary, fontSize: 12, lineHeight: 18 },
  memberDetailDisclaimer: { color: palette.secondary, fontSize: 10, lineHeight: 15, fontStyle: 'italic' },
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
  // Fixed height keeps the band text aligned when a label wraps to two lines.
  metricLabel: { color: palette.secondary, fontSize: 9, fontWeight: '800', lineHeight: 12, minHeight: 24 },
  metricBand: { color: palette.accentDark, fontSize: 13, fontWeight: '900', marginTop: 4 },
  metricBandWatch: { color: '#8A6D1F' },
  metricRange: { color: palette.secondary, fontSize: 10, fontWeight: '600', marginTop: 2 },
  caveatToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 },
  caveatToggleText: { flex: 1, color: palette.secondary, fontSize: 11, fontWeight: '700' },
  caveatBody: { color: palette.secondary, fontSize: 11, lineHeight: 17, marginTop: 2 },
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
  aiCoachCard: {
    backgroundColor: '#F8FCFA',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#DDEBE4',
    padding: 14,
    marginTop: 12,
    gap: 12
  },
  aiCoachIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 10
  },
  aiCoachError: { color: palette.error, fontSize: 11, fontWeight: '700', lineHeight: 16 },
  aiCoachHint: { color: palette.secondary, fontSize: 11, lineHeight: 16 },
  aiCoachReport: { gap: 12 },
  aiCoachSummary: { color: palette.text, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  roleSuggestionCard: {
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.border,
    padding: 10
  },
  roleSuggestionTitle: { color: palette.text, fontSize: 12, fontWeight: '900' },
  roleSuggestionBody: { color: palette.secondary, fontSize: 11, lineHeight: 16, marginTop: 4 },
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
