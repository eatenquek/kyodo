import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { AppButton, Body, Card, H1, ProgressBar, Screen, styles } from '@/components/ui';
import { answerOptions, dimensionLabels, questions } from '@/constants/questions';
import { colors, radius, spacing } from '@/constants/theme';
import { useAppState } from '@/lib/appState';

export default function QuestionScreen() {
  const params = useLocalSearchParams<{ index?: string }>();
  const index = Number(params.index ?? 0);
  const question = questions[index];
  const { answers, saveAnswer } = useAppState();
  const selected = answers[question.id]?.value;

  function select(value: number) {
    saveAnswer({ questionId: question.id, dimension: question.dimension, value, reverse: question.reverse });
  }

  function next() {
    if (index === questions.length - 1) router.push('/(onboarding)/complete');
    else router.push({ pathname: '/(onboarding)/question', params: { index: String(index + 1) } });
  }

  return (
    <Screen>
      <Body secondary>Question {index + 1} of {questions.length}</Body>
      <ProgressBar value={index + 1} max={questions.length} />
      <Body secondary>{dimensionLabels[question.dimension]}</Body>
      <Card>
        <H1>{question.prompt}</H1>
      </Card>
      {answerOptions.map((option) => {
        const active = selected === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => select(option.value)}
            style={({ pressed }) => [
              {
                minHeight: 50,
                borderRadius: radius.input,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.border,
                backgroundColor: active ? colors.accentSoft : colors.surface,
                justifyContent: 'center',
                paddingHorizontal: spacing.lg
              },
              pressed && styles.pressed
            ]}
          >
            <Text style={[styles.body, { fontWeight: active ? '700' : '400' }]}>{option.label}</Text>
          </Pressable>
        );
      })}
      <AppButton title={index === questions.length - 1 ? 'Finish check-in' : 'Continue'} onPress={next} disabled={!selected} />
      {index > 0 ? (
        <AppButton
          title="Back"
          variant="tertiary"
          onPress={() => router.push({ pathname: '/(onboarding)/question', params: { index: String(index - 1) } })}
        />
      ) : null}
    </Screen>
  );
}
