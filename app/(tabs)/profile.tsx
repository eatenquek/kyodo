import { AppButton, Body, Card, H2, PageHeader, Screen } from '@/components/ui';
import { useAppState } from '@/lib/appState';

export default function ProfileScreen() {
  const { profile, signOut, user } = useAppState();

  return (
    <Screen>
      <PageHeader title="Profile" />
      <Card muted>
        <H2>{profile?.fullName || 'Your KyodoAI profile'}</H2>
        <Body secondary>{user?.email || 'Local account'}</Body>
        <Body secondary>Keep your work style and preferred team role in one place.</Body>
      </Card>
      <AppButton title="Sign out" variant="tertiary" onPress={signOut} />
    </Screen>
  );
}
