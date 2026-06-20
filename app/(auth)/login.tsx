import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton, AppTextInput, Body, BrandHeader, H1, Screen } from '@/components/ui';
import { useAppState } from '@/lib/appState';

export default function LoginScreen() {
  const { signIn } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);
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
          keyboardType="email-address"
          error={error}
        />
        <AppTextInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <AppButton title="Sign In" onPress={submit} disabled={!email || !password} loading={loading} />
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
    marginBottom: 12
  },
  form: {
    gap: 16
  }
});
