import { Body, BrandHeader, Card, H1, H2, Screen } from '@/components/ui';

export default function TeamsScreen() {
  return (
    <Screen>
      <BrandHeader compact />
      <H1>Teams</H1>
      <Card muted>
        <H2>Updates coming soon</H2>
        <Body secondary>Team tools will be available in a later update.</Body>
      </Card>
    </Screen>
  );
}
