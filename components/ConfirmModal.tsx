import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

export type ConfirmTone = 'danger' | 'accent'; // danger = destructive, accent = reversible

// shared confirm dialog for anything destructive/consequential
export function ConfirmModal({
  visible,
  icon,
  title,
  body,
  confirmLabel,
  loadingLabel,
  tone = 'danger',
  loading,
  error,
  cancelAccessibilityLabel,
  onClose,
  onConfirm
}: {
  visible: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  loadingLabel: string;
  tone?: ConfirmTone;
  loading: boolean;
  error: string;
  cancelAccessibilityLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const danger = tone === 'danger';

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelAccessibilityLabel}
          onPress={onClose}
          style={styles.backdrop}
        />
        <View accessibilityViewIsModal style={styles.dialog}>
          <View style={[styles.iconWrap, !danger && styles.iconWrapAccent]}>
            <Ionicons name={icon} size={28} color={danger ? colors.error : colors.accentDark} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>

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
              style={({ pressed }) => [
                styles.button,
                danger ? styles.dangerButton : styles.accentButton,
                pressed && styles.pressed,
                loading && styles.disabled
              ]}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
              <Text style={styles.confirmText}>{loading ? loadingLabel : confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export const confirmModalStyles = StyleSheet.create({
  code: {
    color: colors.textPrimary,
    fontWeight: '900',
    letterSpacing: 0.7
  }
});

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
    backgroundColor: colors.background,
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
    backgroundColor: colors.errorSoft,
    marginBottom: 14
  },
  iconWrapAccent: {
    backgroundColor: colors.accentSoft
  },
  title: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center'
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8
  },
  error: {
    width: '100%',
    color: colors.error,
    backgroundColor: colors.errorSoft,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  dangerButton: {
    backgroundColor: colors.error
  },
  accentButton: {
    backgroundColor: colors.accentDark
  },
  cancelText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800'
  },
  confirmText: {
    color: colors.surface,
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
