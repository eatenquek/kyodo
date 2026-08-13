import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton, AppTextInput, Body, BrandHeader, H1, Screen } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/lib/appState';

const minPasswordLength = 6;

export default function RegisterScreen() {
  const { signUp } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const canSubmit = Boolean(email.trim()) && password.length >= minPasswordLength && !loading;

  function clearMessages() {
    setError('');
    setNotice('');
  }

  async function submit() {
    if (!canSubmit) return;

    try {
      setLoading(true);
      clearMessages();
      const authResult = await signUp(email, password);
      if (!authResult.ok) {
        setError(authResult.message);
        return;
      }
      if (authResult.requiresEmailConfirmation) {
        setNotice('Check your email and confirm your account, then return here to sign in.');
        return;
      }
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <BrandHeader compact />
        <H1>Create account</H1>
        <Body secondary>Start building stronger, more compatible teams.</Body>
      </View>
      <View style={styles.form}>
        <AppTextInput
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            clearMessages();
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
          placeholder="Create a password"
          hint={`At least ${minPasswordLength} characters.`}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            clearMessages();
          }}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
          secureTextEntry
        />
        {error ? (
          <Text accessibilityLiveRegion="polite" style={styles.formError}>{error}</Text>
        ) : null}
        {notice ? (
          <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>
        ) : null}
        <AppButton title="Create account" onPress={submit} disabled={!canSubmit} loading={loading} />
        <AppButton title="Already have an account? Sign in" variant="tertiary" onPress={() => router.push('/(auth)/login')} />
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
  },
  notice: {
    color: colors.accentDark,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    fontSize: typography.label,
    fontWeight: '600',
    lineHeight: 19,
    paddingHorizontal: spacing.md,
    paddingVertical: 10
  }
});
