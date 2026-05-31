import { router } from 'expo-router';
import { AppButton, Body, Card, DimensionBar, H1, Screen } from '@/components/ui';
import { dimensionDescriptions, dimensionLabels } from '@/constants/questions';
import { useAppState } from '@/lib/appState';
import { Dimension } from '@/types/domain';

const dimensions: Dimension[] = ['planning', 'communication', 'leadership', 'pace', 'conflict', 'detail', 'collaboration'];

export default function ResultScreen() {
  const { result } = useAppState();

  if (!result) {
    return (
      <Screen>
        <H1>No result yet</H1>
        <Body secondary>Complete your work-style check-in before viewing compatibility.</Body>
        <AppButton title="Start check-in" onPress={() => router.replace('/(onboarding)/questionnaire-intro')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card muted>
        <Body secondary>Your collaboration style</Body>
        <H1>{result.resultLabel}</H1>
        <Body>{result.summaryText}</Body>
      </Card>
      {dimensions.map((dimension) => (
        <DimensionBar key={dimension} label={dimensionLabels[dimension]} score={result[dimension]} description={dimensionDescriptions[dimension]} />
      ))}
      <AppButton title="Create or join a team" onPress={() => router.replace('/(tabs)/teams')} />
      <AppButton title="Back home" variant="secondary" onPress={() => router.replace('/(tabs)/home')} />
    </Screen>
  );
}
