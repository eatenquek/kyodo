import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton, AppTextInput, Body, BrandHeader, H1, Screen } from '@/components/ui';
import { useAppState } from '@/lib/appState';

export default function RegisterScreen() {
  const { signUp } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);
      const authResult = await signUp(email, password);
      if (!authResult.ok) {
        setError(authResult.message);
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
            setError('');
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          error={error}
        />
        <AppTextInput
          label="Password"
          placeholder="At least 6 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <AppButton title="Get Started" onPress={submit} disabled={!email || password.length < 6} loading={loading} />
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
    marginBottom: 12
  },
  form: {
    gap: 16
  }
});
