import { router } from 'expo-router';
import { AppButton, Body, Card, H1, H2, Screen } from '@/components/ui';
import { questions } from '@/constants/questions';
import { useAppState } from '@/lib/appState';

export default function CompleteScreen() {
  const { answers, completeQuestionnaire } = useAppState();
  const count = Object.keys(answers).length;

  async function submit() {
    await completeQuestionnaire();
    router.replace('/(onboarding)/result');
  }

  return (
    <Screen>
      <H1>Check-in complete</H1>
      <Card muted>
        <H2>{count} of {questions.length} answers saved</H2>
        <Body secondary>Your work-style result will be generated from the seven dimension scores.</Body>
      </Card>
      <AppButton title="View my work style" onPress={submit} disabled={count < questions.length} />
    </Screen>
  );
}
