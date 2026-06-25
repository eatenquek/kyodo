import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, ProgressBar, Screen } from '@/components/ui';
import { answerOptions, dimensionLabels, questions } from '@/constants/questions';
import { colors } from '@/constants/theme';
import { useAppState } from '@/lib/appState';

export default function QuestionnaireScreen() {
  const { answers, completeQuestionnaire, saveAnswer } = useAppState();
  const firstUnanswered = questions.findIndex((question) => !answers[question.id]);
  const [questionIndex, setQuestionIndex] = useState(firstUnanswered >= 0 ? firstUnanswered : 0);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');

  const question = questions[questionIndex];
  const selectedValue = answers[question.id]?.value;
  const answeredCount = questions.filter((item) => Boolean(answers[item.id])).length;
  const isLastQuestion = questionIndex === questions.length - 1;

  async function chooseAnswer(value: number) {
    try {
      setSavingAnswer(true);
      setError('');
      await saveAnswer({
        questionId: question.id,
        value
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this answer. Try again.');
    } finally {
      setSavingAnswer(false);
    }
  }

  function goBack() {
    if (questionIndex === 0) return;
    setError('');
    setQuestionIndex((current) => current - 1);
  }

  function goNext() {
    if (selectedValue === undefined || isLastQuestion) return;
    setError('');
    setQuestionIndex((current) => current + 1);
  }

  async function finishQuestionnaire() {
    const missingIndex = questions.findIndex((item) => !answers[item.id]);
    if (missingIndex >= 0) {
      setQuestionIndex(missingIndex);
      setError('Answer this question before completing the questionnaire.');
      return;
    }

    try {
      setCompleting(true);
      setError('');
      await completeQuestionnaire();
      router.replace('/(tabs)/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete the questionnaire. Try again.');
    } finally {
      setCompleting(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Exit questionnaire"
          hitSlop={10}
          onPress={() => router.replace('/(tabs)/profile')}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={23} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>WORK-STYLE QUESTIONNAIRE</Text>
          <Text style={styles.headerTitle}>How do you work in a team?</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressCopy}>
          <Text style={styles.progressLabel}>Question {questionIndex + 1} of {questions.length}</Text>
          <Text style={styles.answeredLabel}>{answeredCount} answered</Text>
        </View>
        <ProgressBar value={questionIndex + 1} max={questions.length} />
      </View>

      <View style={styles.questionCard}>
        <View style={styles.dimensionPill}>
          <Text style={styles.dimensionText}>{dimensionLabels[question.dimension]}</Text>
        </View>
        <Text style={styles.questionText}>{question.prompt}</Text>
        <Text style={styles.helperText}>Choose the answer that best reflects how you usually work.</Text>

        <View style={styles.options}>
          {answerOptions.map((option) => {
            const selected = selectedValue === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled: savingAnswer || completing }}
                disabled={savingAnswer || completing}
                onPress={() => void chooseAnswer(option.value)}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.optionPressed
                ]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.navigation}>
        <View style={styles.navigationSlot}>
          <AppButton title="Back" variant="tertiary" disabled={questionIndex === 0 || completing} onPress={goBack} />
        </View>
        <View style={styles.navigationSlot}>
          <AppButton
            title={isLastQuestion ? 'See my result' : 'Next'}
            loading={completing}
            disabled={selectedValue === undefined || savingAnswer}
            onPress={isLastQuestion ? () => void finishQuestionnaire() : goNext}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center' },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12
  },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  headerTitle: { color: colors.textPrimary, fontSize: 21, fontWeight: '900', marginTop: 3 },
  progressSection: { gap: 9 },
  progressCopy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  answeredLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAF0EC',
    padding: 20,
    shadowColor: '#193C30',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2
  },
  dimensionPill: {
    alignSelf: 'flex-start',
    borderRadius: 99,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 11,
    paddingVertical: 6
  },
  dimensionText: { color: colors.accentDark, fontSize: 10, fontWeight: '800' },
  questionText: { color: colors.textPrimary, fontSize: 22, lineHeight: 30, fontWeight: '800', marginTop: 18 },
  helperText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 8 },
  options: { gap: 9, marginTop: 20 },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FCFDFC',
    paddingHorizontal: 14
  },
  optionSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  optionPressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#AAB3AE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  radioSelected: { borderColor: colors.accentDark },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentDark },
  optionText: { flex: 1, color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  optionTextSelected: { color: colors.textPrimary, fontWeight: '800' },
  error: { color: colors.error, fontSize: 12, lineHeight: 18, fontWeight: '600', textAlign: 'center' },
  navigation: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
  navigationSlot: { flex: 1 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] }
});
