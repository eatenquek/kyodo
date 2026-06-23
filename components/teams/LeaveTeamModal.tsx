import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Team } from '@/types/domain';

const palette = {
  background: '#FBFCFA',
  surface: '#FFFFFF',
  text: '#171C19',
  secondary: '#5A635E',
  border: '#E1E9E4',
  error: '#B9483D',
  errorSoft: '#FCECEA'
};

export function LeaveTeamModal({
  team,
  loading,
  error,
  onClose,
  onConfirm
}: {
  team: Team | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal animationType="fade" transparent visible={Boolean(team)} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Cancel leaving team" onPress={onClose} style={styles.backdrop} />
        <View accessibilityViewIsModal style={styles.dialog}>
          <View style={styles.iconWrap}>
            <Ionicons name="exit-outline" size={28} color={palette.error} />
          </View>
          <Text style={styles.title}>Leave this team?</Text>
          <Text style={styles.body}>
            You’ll need the <Text style={styles.code}>{team?.joinCode}</Text> code to join {team?.name || 'this team'} again.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={onClose}
              style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={onConfirm}
              style={({ pressed }) => [styles.button, styles.leaveButton, pressed && styles.pressed, loading && styles.disabled]}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
              <Text style={styles.leaveText}>{loading ? 'Leaving…' : 'Leave team'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 28, 22, 0.48)'
  },
  dialog: {
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
    backgroundColor: palette.background,
    borderRadius: 22,
    padding: 24,
    shadowColor: '#102019',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 8
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.errorSoft,
    marginBottom: 14
  },
  title: {
    color: palette.text,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.4
  },
  body: {
    color: palette.secondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8
  },
  code: {
    color: palette.text,
    fontWeight: '900',
    letterSpacing: 0.7
  },
  error: {
    width: '100%',
    color: palette.error,
    backgroundColor: palette.errorSoft,
    borderRadius: 10,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    padding: 10,
    marginTop: 14
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 22
  },
  button: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 99
  },
  cancelButton: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border
  },
  leaveButton: {
    backgroundColor: palette.error
  },
  cancelText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '800'
  },
  leaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }]
  },
  disabled: {
    opacity: 0.65
  }
});
