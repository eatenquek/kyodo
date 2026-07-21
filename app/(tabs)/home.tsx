import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressBar } from '@/components/ui';
import { questions } from '@/constants/questions';
import { useAppState } from '@/lib/appState';
import { getJourneyStatus, JourneyStatus } from '@/services/onboarding/journeyStatus';
import { Team } from '@/types/domain';

const avatarColors = ['#EEA29B', '#F0C58B', '#ECA9A5', '#B7DCCC', '#BFC9EC'];

export default function HomeScreen() {
  const { answers, compatibility, getUserTeams, profile, result, user } = useAppState();
  const teams = getUserTeams();
  const answeredCount = questions.filter((question) => Boolean(answers[question.id])).length;

  const journey = getJourneyStatus({
    profile,
    hasResult: Boolean(result),
    answeredCount,
    totalQuestionCount: questions.length,
    teams,
    userId: user?.id ?? 'local-user',
    teamIdsWithInsights: Object.keys(compatibility)
  });

  const goToTeams = () => router.push('/(tabs)/teams');
  const goToProfile = () => router.push('/(tabs)/profile');
  const goToQuestionnaire = () => router.push('/questionnaire');

  const journeyActions: Record<JourneyStatus['stepId'], () => void> = {
    profile: goToProfile,
    questionnaire: goToQuestionnaire,
    team: goToTeams,
    teammates: goToTeams,
    insights: goToTeams,
    complete: goToTeams
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>Home</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.welcomeCopy}>
            <Text style={styles.eyebrow}>
              {profile?.fullName ? `Welcome back, ${profile.fullName.split(' ')[0]}` : 'Welcome to'}
            </Text>
            <Text style={styles.brandName}>
              Kyodo<Text style={styles.brandAccent}>AI</Text>
            </Text>
          </View>
          <PlantIllustration />
        </View>

        <View style={styles.divider} />

        <JourneyCard status={journey} onPress={journeyActions[journey.stepId]} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Teams</Text>
          {teams.length ? (
            <Pressable onPress={goToTeams} hitSlop={10} style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          ) : null}
        </View>

        {teams.length ? (
          teams.slice(0, 3).map((team) => <TeamSummaryCard key={team.id} team={team} onPress={goToTeams} />)
        ) : (
          <View style={styles.emptyTeamsCard}>
            <View style={styles.emptyTeamsIcon}>
              <Ionicons name="people-outline" size={26} color="#087453" />
            </View>
            <Text style={styles.emptyTeamsTitle}>No teams yet</Text>
            <Text style={styles.emptyTeamsBody}>
              Create a team for your next project, or join one with a code from a peer.
            </Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start a new team"
          onPress={goToTeams}
          style={({ pressed }) => [styles.startCard, pressed && styles.cardPressed]}
        >
          <View style={styles.startCopy}>
            <Text style={styles.startTitle}>Start a new team</Text>
            <Text style={styles.startDescription}>Create a team and invite{`\n`}your peers to collaborate.</Text>
          </View>
          <View style={styles.addButton}>
            <Ionicons name="add" size={31} color="#FFFFFF" />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function JourneyCard({ status, onPress }: { status: JourneyStatus; onPress: () => void }) {
  const complete = status.stepId === 'complete';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${status.title}. ${status.description}`}
      onPress={onPress}
      style={({ pressed }) => [styles.journeyCard, pressed && styles.cardPressed]}
    >
      <View style={styles.journeyHeader}>
        <View style={[styles.journeyIcon, complete && styles.journeyIconComplete]}>
          <Ionicons
            name={complete ? 'checkmark-circle' : 'flag-outline'}
            size={20}
            color={complete ? '#FFFFFF' : '#087453'}
          />
        </View>
        <View style={styles.journeyCopy}>
          <Text style={styles.journeyEyebrow}>{complete ? 'SETUP COMPLETE' : 'YOUR NEXT STEP'}</Text>
          <Text style={styles.journeyTitle}>{status.title}</Text>
        </View>
        <Text style={styles.journeyProgress}>
          {status.completedCount}/{status.totalCount}
        </Text>
      </View>

      <ProgressBar value={status.completedCount} max={status.totalCount} />
      <Text style={styles.journeyBody}>{status.description}</Text>

      {status.actionLabel ? (
        <View style={styles.journeyAction}>
          <Text style={styles.journeyActionText}>{status.actionLabel}</Text>
          <Ionicons name="arrow-forward" size={15} color="#087453" />
        </View>
      ) : null}
    </Pressable>
  );
}

function TeamSummaryCard({ team, onPress }: { team: Team; onPress: () => void }) {
  const memberCount = team.members.length;
  const readyCount = team.members.filter((member) => member.result).length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${team.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.teamCard, pressed && styles.cardPressed]}
    >
      <View style={styles.teamBadge}>
        <Ionicons name="people" size={25} color="#087453" />
      </View>
      <View style={styles.teamDetails}>
        <Text numberOfLines={1} style={styles.teamName}>{team.name}</Text>
        <View style={styles.memberRow}>
          <View style={styles.avatarStack}>
            {team.members.slice(0, 3).map((member, index) => (
              <View
                key={member.id}
                style={[
                  styles.avatar,
                  { backgroundColor: avatarColors[index % avatarColors.length], marginLeft: index === 0 ? 0 : -5 }
                ]}
              >
                <Text style={styles.avatarText}>{member.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.memberCount}>
            {memberCount} {memberCount === 1 ? 'member' : 'members'} · {readyCount} ready
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={19} color="#A6AAA7" />
    </Pressable>
  );
}

function PlantIllustration() {
  return (
    <View accessibilityElementsHidden style={styles.plantWrap}>
      <View style={styles.plantHalo} />
      <View style={styles.stemMain} />
      <View style={styles.stemLeft} />
      <View style={styles.stemRight} />
      <Ionicons name="leaf" size={31} color="#0D8B61" style={styles.leafTop} />
      <Ionicons name="leaf" size={32} color="#16A273" style={styles.leafLeft} />
      <Ionicons name="leaf" size={34} color="#087453" style={styles.leafRight} />
      <View style={styles.soil} />
      <View style={styles.pot} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBFCFA'
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  pageTitle: {
    color: '#161B18',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  hero: {
    minHeight: 126,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingHorizontal: 1
  },
  welcomeCopy: {
    flex: 1,
    paddingRight: 10
  },
  eyebrow: {
    color: '#343936',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2
  },
  brandName: {
    color: '#111513',
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1.2
  },
  brandAccent: {
    color: '#0A815B'
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E8E5',
    marginHorizontal: -20,
    marginBottom: 17
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13
  },
  sectionTitle: {
    color: '#242A26',
    fontSize: 18,
    fontWeight: '800'
  },
  viewAll: {
    color: '#087453',
    fontSize: 14,
    fontWeight: '600'
  },
  journeyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E1E9E4',
    padding: 16,
    marginBottom: 20,
    gap: 11
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  journeyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF2E9',
    marginRight: 11
  },
  journeyIconComplete: {
    backgroundColor: '#15906A'
  },
  journeyCopy: {
    flex: 1,
    paddingRight: 8
  },
  journeyEyebrow: {
    color: '#15906A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1
  },
  journeyTitle: {
    color: '#171C19',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3
  },
  journeyProgress: {
    color: '#5A635E',
    fontSize: 12,
    fontWeight: '800'
  },
  journeyBody: {
    color: '#5A635E',
    fontSize: 13,
    lineHeight: 19
  },
  journeyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  journeyActionText: {
    color: '#087453',
    fontSize: 13,
    fontWeight: '800'
  },
  emptyTeamsCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E1E9E4',
    paddingHorizontal: 22,
    paddingVertical: 26
  },
  emptyTeamsIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF2E9',
    marginBottom: 12
  },
  emptyTeamsTitle: {
    color: '#242A26',
    fontSize: 17,
    fontWeight: '800'
  },
  emptyTeamsBody: {
    color: '#555B57',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6
  },
  teamCard: {
    minHeight: 91,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 15,
    shadowColor: '#193C30',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 3
  },
  teamBadge: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF2E9',
    marginRight: 13
  },
  teamDetails: {
    flex: 1,
    gap: 7
  },
  teamName: {
    color: '#246B56',
    fontSize: 17,
    fontWeight: '800'
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: '#17392F',
    fontSize: 9,
    fontWeight: '900'
  },
  memberCount: {
    color: '#555C58',
    fontSize: 13,
    fontWeight: '500'
  },
  startCard: {
    minHeight: 115,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    marginTop: 17,
    paddingHorizontal: 15,
    paddingVertical: 17,
    shadowColor: '#193C30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 11,
    elevation: 2
  },
  startCopy: {
    flex: 1,
    paddingRight: 12
  },
  startTitle: {
    color: '#2A302C',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 5
  },
  startDescription: {
    color: '#555B57',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#11895F',
    shadowColor: '#087453',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3
  },
  pressed: {
    opacity: 0.55
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  plantWrap: {
    width: 100,
    height: 102,
    position: 'relative'
  },
  plantHalo: {
    position: 'absolute',
    width: 80,
    height: 80,
    top: 4,
    left: 8,
    borderRadius: 40,
    backgroundColor: '#EDF7F1'
  },
  stemMain: {
    position: 'absolute',
    width: 4,
    height: 53,
    left: 48,
    top: 21,
    borderRadius: 3,
    backgroundColor: '#17966C',
    transform: [{ rotate: '-3deg' }]
  },
  stemLeft: {
    position: 'absolute',
    width: 3,
    height: 28,
    left: 38,
    top: 37,
    borderRadius: 3,
    backgroundColor: '#17966C',
    transform: [{ rotate: '-43deg' }]
  },
  stemRight: {
    position: 'absolute',
    width: 3,
    height: 30,
    left: 59,
    top: 39,
    borderRadius: 3,
    backgroundColor: '#17966C',
    transform: [{ rotate: '45deg' }]
  },
  leafTop: {
    position: 'absolute',
    left: 43,
    top: 7,
    transform: [{ rotate: '-28deg' }]
  },
  leafLeft: {
    position: 'absolute',
    left: 19,
    top: 30,
    transform: [{ rotate: '-54deg' }]
  },
  leafRight: {
    position: 'absolute',
    left: 59,
    top: 38,
    transform: [{ rotate: '34deg' }]
  },
  soil: {
    position: 'absolute',
    left: 19,
    top: 72,
    width: 64,
    height: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#087453'
  },
  pot: {
    position: 'absolute',
    left: 24,
    top: 78,
    width: 54,
    height: 14,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#0A7956',
    transform: [{ perspective: 50 }, { rotateX: '-8deg' }]
  }
});
