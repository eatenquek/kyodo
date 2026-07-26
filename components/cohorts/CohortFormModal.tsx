import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppTextInput } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppState } from '@/lib/appState';
import { parseInviteInput } from '@/services/teams/inviteLink';
import { TargetSizeStepper } from '@/components/cohorts/TargetSizeStepper';
import { SchoolPicker } from '@/components/cohorts/SchoolPicker';
import { universities, universityLogos } from '@/constants/universities';
import { Cohort } from '@/types/domain';

export type CohortFormMode = 'create' | 'join' | 'edit' | null;

function findSchool(slug?: string) {
  const match = universities.find((uni) => uni.slug === slug);
  return match ? { slug: match.slug, name: match.name } : null;
}

export function CohortFormModal({
  mode,
  cohort,
  onClose
}: {
  mode: CohortFormMode;
  cohort?: Cohort | null;
  onClose: () => void;
}) {
  const { createCohort, updateCohort, joinCohort } = useAppState();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetGroupSize, setTargetGroupSize] = useState(4);
  const [school, setSchool] = useState<{ slug: string; name: string } | null>(null);
  const [schoolPickerVisible, setSchoolPickerVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const creating = mode === 'create';
  const editing = mode === 'edit';

  // prefill when the organiser opens the edit sheet, reset once it closes
  useEffect(() => {
    setError('');
    if (mode === 'edit' && cohort) {
      setName(cohort.name);
      setDescription(cohort.description ?? '');
      setSchool(findSchool(cohort.school));
      return;
    }
    if (!mode) setSchool(null);
  }, [mode, cohort?.id]);

  function close() {
    if (!loading) onClose();
  }

  async function submit() {
    try {
      setLoading(true);
      setError('');

      if (creating || editing) {
        if (!name.trim()) {
          setError('Give the cohort a name, such as your module or tutorial group.');
          return;
        }
        if (!school) {
          setError('Pick the school this cohort belongs to.');
          return;
        }
        if (editing && cohort) {
          await updateCohort(cohort.id, name, description, school.slug);
        } else {
          await createCohort(name, description, targetGroupSize, school.slug);
          setName('');
          setDescription('');
          setSchool(null);
        }
      } else {
        if (joinCode.length !== 6) {
          setError('Enter the 6-character cohort code.');
          return;
        }
        const joined = await joinCohort(joinCode);
        if (!joined) {
          setError('That code was not found, or you already joined this cohort.');
          return;
        }
        setJoinCode('');
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal animationType="slide" transparent visible={Boolean(mode)} onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <Pressable accessibilityLabel="Close cohort form" onPress={close} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>{editing ? 'EDIT COHORT' : creating ? 'NEW COHORT' : 'COHORT INVITE'}</Text>
              <Text style={styles.title}>
                {editing ? 'Edit this cohort' : creating ? 'Create a cohort' : 'Join a cohort'}
              </Text>
            </View>
            <Pressable accessibilityLabel="Close" hitSlop={10} onPress={close} style={styles.closeButton}>
              <Ionicons name="close" size={23} color={colors.textPrimary} />
            </Pressable>
          </View>

          {creating || editing ? (
            <View style={styles.fields}>
              <AppTextInput
                label="Cohort name"
                placeholder="e.g. CS3216 Tutorial 4"
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setError('');
                }}
              />
              <AppTextInput
                label="Description"
                placeholder="Optional"
                value={description}
                onChangeText={setDescription}
              />
              <View style={styles.sizeField}>
                <Text style={styles.label}>School</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose a school"
                  onPress={() => setSchoolPickerVisible(true)}
                  style={({ pressed }) => [styles.schoolField, pressed && styles.pressed]}
                >
                  {school ? (
                    <>
                      <Image source={universityLogos[school.slug]} style={styles.schoolLogo} resizeMode="contain" />
                      <Text numberOfLines={1} style={styles.schoolName}>{school.name}</Text>
                    </>
                  ) : (
                    <Text style={styles.schoolPlaceholder}>Pick your school</Text>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>

              {creating ? (
                <View style={styles.sizeField}>
                  <Text style={styles.label}>Target team size</Text>
                  <Text style={styles.help}>You can change this later before running the split.</Text>
                  <TargetSizeStepper value={targetGroupSize} max={12} onChange={setTargetGroupSize} />
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.fields}>
              <AppTextInput
                label="6-character cohort code"
                placeholder="ABC123"
                value={joinCode}
                onChangeText={(value) => {
                  setJoinCode(parseInviteInput(value) ?? value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                  setError('');
                }}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Text style={styles.help}>Your tutor or organiser shares this code with the class.</Text>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton
            title={editing ? 'Save changes' : creating ? 'Create cohort' : 'Join cohort'}
            loading={loading}
            disabled={creating || editing ? !name.trim() || !school : joinCode.length !== 6}
            onPress={() => void submit()}
          />
        </View>
      </KeyboardAvoidingView>

      <SchoolPicker
        visible={schoolPickerVisible}
        onClose={() => setSchoolPickerVisible(false)}
        onSelect={(slug, schoolName) => setSchool({ slug, name: schoolName })}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17, 28, 22, 0.42)' },
  sheet: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 30,
    gap: 18
  },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#CBD2CE', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.textPrimary, fontSize: 23, fontWeight: '900', marginTop: 4 },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF3F0'
  },
  fields: { gap: 14 },
  sizeField: { gap: 6 },
  schoolField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  schoolLogo: { width: 28, height: 28 },
  schoolName: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  schoolPlaceholder: { flex: 1, color: colors.textSecondary, fontSize: 14 },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  help: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  error: { color: colors.error, fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.75 }
});
