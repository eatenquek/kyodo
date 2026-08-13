import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

// renders above the navigator, so no Screen and no safe area provider yet
export function StartupError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons name="cloud-offline-outline" size={26} color={colors.accentDark} />
        </View>
        <Text style={styles.title}>KyodoAI could not load your account</Text>
        <Text style={styles.body}>
          This usually means the connection dropped. Your teams and answers are safe on the server.
        </Text>
        <Text numberOfLines={3} style={styles.detail}>{message}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.h3,
    fontWeight: '800',
    lineHeight: 25,
    textAlign: 'center'
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 21,
    textAlign: 'center'
  },
  detail: {
    color: colors.textSecondary,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.input,
    fontSize: typography.caption,
    lineHeight: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlign: 'center'
  },
  button: {
    minHeight: 48,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    backgroundColor: colors.accentDark,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs
  },
  buttonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800'
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }]
  }
});
