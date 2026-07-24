import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton, Screen } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppState } from '@/lib/appState';
import { savePendingInvite } from '@/lib/pendingInvite';
import { parseInviteInput } from '@/services/teams/inviteLink';

type Status = 'working' | 'needsAuth' | 'invalid' | 'failed';

// handles kyodoai://join/<code> and /join/<code> on web
// signed in -> joins right away, signed out -> parks the code and sends to sign up
export default function JoinByCodeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { joinTeam, user } = useAppState();
  const [status, setStatus] = useState<Status>('working');
  const [message, setMessage] = useState('');
  const attempted = useRef(false);

  const joinCode = parseInviteInput(Array.isArray(code) ? code[0] : code ?? '');

  useEffect(() => {
    if (attempted.current) return;

    if (!joinCode) {
      attempted.current = true;
      setStatus('invalid');
      return;
    }

    if (!user) {
      attempted.current = true;
      void savePendingInvite(joinCode).then(() => setStatus('needsAuth'));
      return;
    }

    attempted.current = true;
    (async () => {
      try {
        const joined = await joinTeam(joinCode);
        if (joined) {
          router.replace('/(tabs)/teams');
          return;
        }
        setStatus('failed');
        setMessage('That code was not found, or you are already on this team.');
      } catch (err) {
        setStatus('failed');
        setMessage(err instanceof Error ? err.message : 'Could not join that team.');
      }
    })();
  }, [joinCode, joinTeam, user]);

  if (status === 'working') {
    return (
      <Screen>
        <View style={styles.centre}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.body}>Joining {joinCode}…</Text>
        </View>
      </Screen>
    );
  }

  const copy = {
    needsAuth: {
      icon: 'person-add-outline' as const,
      title: 'Create an account to join',
      body: `We'll add you to the team as soon as you're signed in. Your invite code ${joinCode} is saved.`,
      action: 'Get started',
      onPress: () => router.replace('/(auth)/welcome')
    },
    invalid: {
      icon: 'help-circle-outline' as const,
      title: 'That invite link looks wrong',
      body: 'Ask your teammate to resend it, or enter the 6-character code by hand on the Teams tab.',
      action: 'Go to teams',
      onPress: () => router.replace('/(tabs)/teams')
    },
    failed: {
      icon: 'alert-circle-outline' as const,
      title: 'Could not join',
      body: message,
      action: 'Go to teams',
      onPress: () => router.replace('/(tabs)/teams')
    }
  }[status];

  return (
    <Screen>
      <View style={styles.centre}>
        <View style={styles.icon}>
          <Ionicons name={copy.icon} size={30} color={colors.accentDark} />
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
        <View style={styles.action}>
          <AppButton title={copy.action} onPress={copy.onPress} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 8 },
  icon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft
  },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: 8 }
});
