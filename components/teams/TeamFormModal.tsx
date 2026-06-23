import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { AppButton, AppTextInput } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppState } from '@/lib/appState';

export type TeamFormMode = 'create' | 'join' | null;

export function TeamFormModal({ mode, onClose }: { mode: TeamFormMode; onClose: () => void }) {
  const { createTeam, joinTeam } = useAppState();
  const [teamName, setTeamName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
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

  async function submitCreateTeam() {
    if (!teamName.trim()) {
      setError('Give your team a name first.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await createTeam(teamName, projectName, description);
      setTeamName('');
      setProjectName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create this team.');
    } finally {
      setLoading(false);
    }
  }

  async function submitJoinTeam() {
    if (joinCode.length !== 6) {
      setError('Enter the 6-character team code.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const joined = await joinTeam(joinCode);
      if (!joined) {
        setError('That code was not found, or you already joined this team.');
        return;
      }
      setJoinCode('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join this team.');
    } finally {
      setLoading(false);
    }
  }

  function updateJoinCode(value: string) {
    setJoinCode(value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
    setError('');
  }

  return (
    <Modal animationType="slide" transparent visible={Boolean(mode)} onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close team form" onPress={close} style={styles.modalBackdrop} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalEyebrow}>{creating ? 'NEW TEAM' : 'TEAM INVITE'}</Text>
              <Text style={styles.modalTitle}>{creating ? 'Create a team' : 'Join with a code'}</Text>
            </View>
            <Pressable accessibilityLabel="Close" hitSlop={10} onPress={close} style={styles.closeButton}>
              <Ionicons name="close" size={23} color={colors.textPrimary} />
            </Pressable>
          </View>

          {creating ? (
            <View style={styles.formFields}>
              <AppTextInput
                label="Team name"
                placeholder="e.g. Project Gemini"
                value={teamName}
                onChangeText={(value) => {
                  setTeamName(value);
                  setError('');
                }}
              />
              <AppTextInput label="Project name" placeholder="Optional" value={projectName} onChangeText={setProjectName} />
              <AppTextInput
                label="Description"
                placeholder="What is your team working on?"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          ) : (
            <View style={styles.formFields}>
              <AppTextInput
                label="6-character team code"
                placeholder="ABC123"
                value={joinCode}
                onChangeText={updateJoinCode}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
              />
              <Text style={styles.joinHelp}>Ask a teammate to share the code shown on their team page.</Text>
            </View>
          )}

          {error ? <Text style={styles.formError}>{error}</Text> : null}
          <AppButton
            title={creating ? 'Create team' : 'Join team'}
            loading={loading}
            disabled={creating ? !teamName.trim() : joinCode.length !== 6}
            onPress={creating ? () => void submitCreateTeam() : () => void submitJoinTeam()}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 28, 22, 0.42)'
  },
  modalSheet: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: '#FBFCFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 30,
    gap: 18
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD2CE',
    alignSelf: 'center'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  modalEyebrow: {
    color: '#15906A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  modalTitle: {
    color: '#171C19',
    fontSize: 23,
    fontWeight: '900',
    marginTop: 4
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF3F0'
  },
  formFields: {
    gap: 14
  },
  joinHelp: {
    color: '#5A635E',
    fontSize: 12,
    lineHeight: 18
  },
  formError: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600'
  }
});
