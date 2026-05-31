import { router } from 'expo-router';
import { useState } from 'react';
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
    <Screen>
      <BrandHeader compact />
      <H1>Create account</H1>
      <Body secondary>Create an account. Log in will only work after this account exists.</Body>
      <AppTextInput
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setError('');
        }}
        autoCapitalize="none"
        keyboardType="email-address"
        error={error}
      />
      <AppTextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <AppButton title="Create account" onPress={submit} disabled={!email || password.length < 6} loading={loading} />
      <AppButton title="Already have an account? Log in" variant="tertiary" onPress={() => router.push('/(auth)/login')} />
    </Screen>
  );
}
