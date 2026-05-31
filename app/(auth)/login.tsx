import { router } from 'expo-router';
import { useState } from 'react';
import { AppButton, AppTextInput, Body, BrandHeader, H1, Screen } from '@/components/ui';
import { useAppState } from '@/lib/appState';

export default function LoginScreen() {
  const { signIn, profile, result } = useAppState();
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

      if (!authResult.profileComplete) router.replace('/(onboarding)/profile-setup');
      else if (!authResult.resultComplete) router.replace('/(onboarding)/questionnaire-intro');
      else router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <BrandHeader compact />
      <H1>Log in</H1>
      <Body secondary>Use an email you created earlier.</Body>
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
      <AppButton title="Log in" onPress={submit} disabled={!email || !password} loading={loading} />
      <AppButton title="Create account" variant="tertiary" onPress={() => router.push('/(auth)/register')} />
    </Screen>
  );
}
