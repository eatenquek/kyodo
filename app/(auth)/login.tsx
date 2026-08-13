import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton, AppTextInput, Body, BrandHeader, H1, Screen } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/lib/appState';

export default function LoginScreen() {
  const { signIn } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const canSubmit = Boolean(email.trim()) && Boolean(password) && !loading;

  async function submit() {
    if (!canSubmit) return;

    try {
      setLoading(true);
      setError('');
      const authResult = await signIn(email, password);
      if (!authResult.ok) {
        setError(authResult.message);
        return;
      }

      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <BrandHeader compact />
        <H1>Sign in</H1>
        <Body secondary>Welcome back. Sign in to continue to your teams.</Body>
      </View>
      <View style={styles.form}>
        <AppTextInput
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError('');
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <AppTextInput
          ref={passwordRef}
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError('');
          }}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
          secureTextEntry
        />
        {/* form level, because a rejected sign-in is rarely about one field */}
        {error ? (
          <Text accessibilityLiveRegion="polite" style={styles.formError}>{error}</Text>
        ) : null}
        <AppButton title="Sign in" onPress={submit} disabled={!canSubmit} loading={loading} />
        <AppButton title="Create an account" variant="tertiary" onPress={() => router.push('/(auth)/register')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    paddingHorizontal: 28
  },
  header: {
    alignItems: 'center',
    gap: 9,
    marginBottom: spacing.md
  },
  form: {
    gap: spacing.lg
  },
  formError: {
    color: colors.error,
    backgroundColor: colors.errorSoft,
    borderRadius: radius.sm,
    fontSize: typography.label,
    fontWeight: '600',
    lineHeight: 19,
    paddingHorizontal: spacing.md,
    paddingVertical: 10
  }
});
