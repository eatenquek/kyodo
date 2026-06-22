import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '@/lib/appState';
import { Team } from '@/types/domain';

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

export default function TeamsScreen() {
  const { getActiveTeam, getUserTeams, selectTeam } = useAppState();
  const teams = getUserTeams();
  const activeTeam = getActiveTeam();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.backgroundGlow} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Teams</Text>
          <View style={styles.headerMark}>
            <Ionicons name="people" size={22} color={palette.accentDark} />
          </View>
        </View>

        <View style={styles.introCard}>
          <View style={styles.introCopy}>
            <Text style={styles.eyebrow}>YOUR TEAM SPACE</Text>
            <Text style={styles.introTitle}>Build better together.</Text>
            <Text style={styles.introBody}>Keep your project teams, members, and shared progress in one place.</Text>
          </View>
          <View style={styles.introIcon}>
            <Ionicons name="people" size={35} color={palette.accentDark} />
          </View>
        </View>

        {teams.length ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your teams</Text>
              <Text style={styles.sectionCount}>{teams.length}</Text>
            </View>
            <View style={styles.teamList}>
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  active={team.id === activeTeam?.id}
                  onPress={() => selectTeam(team.id)}
                />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={31} color={palette.accentDark} />
            </View>
            <Text style={styles.emptyTitle}>No teams yet</Text>
            <Text style={styles.emptyBody}>Teams you create or join will appear here.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TeamCard({ team, active, onPress }: { team: Team; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.teamCard, active && styles.teamCardActive, pressed && styles.pressed]}
    >
      <View style={[styles.teamBadge, active && styles.teamBadgeActive]}>
        <Ionicons name="people" size={23} color={active ? '#FFFFFF' : palette.accentDark} />
      </View>
      <View style={styles.teamCopy}>
        <Text numberOfLines={1} style={styles.teamName}>{team.name}</Text>
        <Text numberOfLines={1} style={styles.teamMeta}>
          {team.projectName || 'Project team'} · {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
        </Text>
      </View>
      <Ionicons
        name={active ? 'checkmark-circle' : 'chevron-forward'}
        size={21}
        color={active ? palette.accent : '#9BA29E'}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background
  },
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
  pageHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  pageTitle: {
    color: palette.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6
  },
  headerMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft
  },
  introCard: {
    minHeight: 118,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.accentSoft,
    borderRadius: 18,
    padding: 18
  },
  introCopy: {
    flex: 1,
    paddingRight: 12
  },
  eyebrow: {
    color: palette.accentDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2
  },
  introTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 5
  },
  introBody: {
    color: palette.secondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6
  },
  introIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800'
  },
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
  teamList: {
    gap: 10
  },
  teamCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface
  },
  teamCardActive: {
    borderColor: palette.accent,
    backgroundColor: '#F8FCFA'
  },
  teamBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
    marginRight: 12
  },
  teamBadgeActive: {
    backgroundColor: palette.accent
  },
  teamCopy: {
    flex: 1,
    paddingRight: 8
  },
  teamName: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800'
  },
  teamMeta: {
    color: palette.secondary,
    fontSize: 12,
    marginTop: 5
  },
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
  emptyTitle: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '800'
  },
  emptyBody: {
    color: palette.secondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 7
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }]
  }
});
