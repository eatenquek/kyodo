import { router } from 'expo-router';
import { AppButton, Body, BrandHeader, Card, H1, H2, Screen } from '@/components/ui';

export default function WelcomeScreen() {
  return (
    <Screen>
      <BrandHeader />
      <H1>Build better student teams</H1>
      <Body secondary>
        Understand your work style, create project teams, and spot collaboration habits before deadlines get messy.
      </Body>
      <Card muted>
        <H2>Milestone 1 loop</H2>
        <Body>Work-style check-in</Body>
        <Body>Saved profile and result</Body>
        <Body>Team compatibility and practical tips</Body>
      </Card>
      <AppButton title="Create account" onPress={() => router.push('/(auth)/register')} />
      <AppButton title="Log in" variant="secondary" onPress={() => router.push('/(auth)/login')} />
    </Screen>
  );
}
