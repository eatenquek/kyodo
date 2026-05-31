import { AppButton, Body, BrandHeader, Card, H1, H2, Screen } from '@/components/ui';
import { useAppState } from '@/lib/appState';

export default function HomeScreen() {
  const { user, signOut } = useAppState();

  return (
    <Screen>
      <BrandHeader compact />
      <H1>Home</H1>
      <Card muted>
        <Body secondary>{user?.email || 'Signed in'}</Body>
        <H2>Welcome to KyodoAI</H2>
        <Body secondary>Your account is ready. More workspace features are coming soon.</Body>
      </Card>
      <AppButton title="Sign out" variant="tertiary" onPress={signOut} />
    </Screen>
  );
}
