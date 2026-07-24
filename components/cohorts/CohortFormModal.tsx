import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppTextInput } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppState } from '@/lib/appState';
import { parseInviteInput } from '@/services/teams/inviteLink';

export type CohortFormMode = 'create' | 'join' | null;

const groupSizeOptions = [2, 3, 4, 5, 6];

export function CohortFormModal({ mode, onClose }: { mode: CohortFormMode; onClose: () => void }) {
  const { createCohort, joinCohort } = useAppState();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetGroupSize, setTargetGroupSize] = useState(4);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const creating = mode === 'create';

  useEffect(() => {
    setError('');
  }, [mode]);

  function close() {
    if (!loading) onClose();
  }

  async function submit() {
    try {
      setLoading(true);
      setError('');

      if (creating) {
        if (!name.trim()) {
          setError('Give the cohort a name, such as your module or tutorial group.');
          return;
        }
        await createCohort(name, description, targetGroupSize);
        setName('');
        setDescription('');
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
              <Text style={styles.eyebrow}>{creating ? 'NEW COHORT' : 'COHORT INVITE'}</Text>
              <Text style={styles.title}>{creating ? 'Create a cohort' : 'Join a cohort'}</Text>
            </View>
            <Pressable accessibilityLabel="Close" hitSlop={10} onPress={close} style={styles.closeButton}>
              <Ionicons name="close" size={23} color={colors.textPrimary} />
            </Pressable>
          </View>

          {creating ? (
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
                <Text style={styles.label}>Target team size</Text>
                <Text style={styles.help}>You can change this later before running the split.</Text>
                <View style={styles.sizeRow}>
                  {groupSizeOptions.map((size) => {
                    const selected = size === targetGroupSize;
                    return (
                      <Pressable
                        key={size}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`Target team size ${size}`}
                        onPress={() => setTargetGroupSize(size)}
                        style={({ pressed }) => [styles.sizeChip, selected && styles.sizeChipActive, pressed && styles.pressed]}
                      >
                        <Text style={[styles.sizeChipText, selected && styles.sizeChipTextActive]}>{size}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
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
            title={creating ? 'Create cohort' : 'Join cohort'}
            loading={loading}
            disabled={creating ? !name.trim() : joinCode.length !== 6}
            onPress={() => void submit()}
          />
        </View>
      </KeyboardAvoidingView>
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
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  help: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  sizeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  sizeChip: {
    minWidth: 44,
    minHeight: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  sizeChipActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  sizeChipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '900' },
  sizeChipTextActive: { color: '#FFFFFF' },
  error: { color: colors.error, fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.75 }
});
