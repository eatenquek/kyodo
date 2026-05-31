import { Body, BrandHeader, Card, H1, H2, Screen } from '@/components/ui';
import { useAppState } from '@/lib/appState';

export default function ProfileScreen() {
  const { user } = useAppState();

  return (
    <Screen>
      <BrandHeader compact />
      <H1>Profile</H1>
      <Card muted>
        <Body secondary>{user?.email || 'Local account'}</Body>
        <H2>Updates coming soon</H2>
        <Body secondary>Profile tools will be available in a later update.</Body>
      </Card>
    </Screen>
  );
}
