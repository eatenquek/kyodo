import { router } from 'expo-router';
import { AppButton, Body, Card, H1, H2, Screen } from '@/components/ui';

export default function QuestionnaireIntroScreen() {
  return (
    <Screen>
      <H1>Let’s map how you work</H1>
      <Body secondary>This is a work-style check-in, not a personality diagnosis. You will answer 21 quick prompts across seven collaboration dimensions.</Body>
      <Card muted>
        <H2>What happens next</H2>
        <Body>1. Answer one prompt at a time</Body>
        <Body>2. Get a readable work-style result</Body>
        <Body>3. Use it to compare team habits constructively</Body>
      </Card>
      <AppButton title="Start setup" onPress={() => router.push({ pathname: '/(onboarding)/question', params: { index: '0' } })} />
    </Screen>
  );
}
