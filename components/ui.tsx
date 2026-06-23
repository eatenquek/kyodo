import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/constants/theme';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, scroll = true, contentStyle }: ScreenProps) {
  const content = <View style={[styles.screenInner, contentStyle]}>{children}</View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.backgroundGlow} />
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : content}
    </SafeAreaView>
  );
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles[`${variant}Button`],
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed
      ]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.surface : colors.accentDark} /> : null}
      <Text style={[styles.buttonText, styles[`${variant}ButtonText`]]}>{title}</Text>
    </Pressable>
  );
}

export function AppTextInput({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#9AA39E"
        style={[styles.input, Boolean(error) && styles.inputError]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Card({ children, muted }: PropsWithChildren<{ muted?: boolean }>) {
  return <View style={[styles.card, muted && styles.mutedCard]}>{children}</View>;
}

export function H1({ children }: PropsWithChildren) {
  return <Text style={styles.h1}>{children}</Text>;
}

export function H2({ children }: PropsWithChildren) {
  return <Text style={styles.h2}>{children}</Text>;
}

export function Body({ children, secondary }: PropsWithChildren<{ secondary?: boolean }>) {
  return <Text style={[styles.body, secondary && styles.secondaryText]}>{children}</Text>;
}

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.pageHeader}>
      <Text style={styles.pageHeaderTitle}>{title}</Text>
      {action ?? <KyodoLogoMark size={34} />}
    </View>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(4, (value / max) * 100)}%` }]} />
    </View>
  );
}

export function DimensionBar({ label, score, description }: { label: string; score: number; description?: string }) {
  return (
    <View style={styles.dimension}>
      <View style={styles.rowBetween}>
        <Text style={styles.dimensionLabel}>{label}</Text>
        <Text style={styles.scoreText}>{score}</Text>
      </View>
      <ProgressBar value={score} max={100} />
      {description ? <Text style={styles.caption}>{description}</Text> : null}
    </View>
  );
}

export function EmptyState({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <Card muted>
      <View style={styles.emptyIcon}>
        <Ionicons name="sparkles-outline" size={23} color={colors.accentDark} />
      </View>
      <H2>{title}</H2>
      <Body secondary>{body}</Body>
      {actionLabel ? <AppButton title={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </Card>
  );
}

export function BrandHeader({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.brandHeader, compact && styles.brandHeaderCompact]}>
      <KyodoLogoMark size={compact ? 56 : 94} />
      <Text style={[styles.brandText, compact && styles.brandTextCompact]}>
        Kyodo<Text style={styles.brandTextAccent}>AI</Text>
      </Text>
      {!compact ? <Text style={styles.brandTagline}>Better team awareness,{`\n`}Stronger together.</Text> : null}
    </View>
  );
}

export function KyodoLogoMark({ size = 58 }: { size?: number }) {
  const scale = size / 72;

  return (
    <View accessibilityLabel="KyodoAI logo" style={{ width: size, height: size }}>
      <View
        style={[
          styles.markCanvas,
          {
            left: (size - 72) / 2,
            top: (size - 72) / 2,
            transform: [{ scale }]
          }
        ]}
      >
        <View style={[styles.markLine, styles.markLineA]} />
        <View style={[styles.markLine, styles.markLineB]} />
        <View style={[styles.markLine, styles.markLineC]} />
        <View style={[styles.markLine, styles.markLineD]} />
        <View style={[styles.markLine, styles.markLineE]} />
        <View style={[styles.markLine, styles.markLineF]} />
        <View style={[styles.markNode, styles.markNodeA]} />
        <View style={[styles.markNode, styles.markNodeB]} />
        <View style={[styles.markNode, styles.markNodeC]} />
        <View style={[styles.markNode, styles.markNodeD]} />
        <View style={[styles.markNode, styles.markNodeE]} />
        <View style={[styles.markNode, styles.markNodeF]} />
        <View style={[styles.markNode, styles.markNodeG]} />
        <View style={[styles.markNode, styles.markNodeH]} />
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  backgroundGlow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    top: -110,
    right: -115,
    backgroundColor: '#F0F8F3'
  },
  scrollContent: {
    flexGrow: 1
  },
  screenInner: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 32,
    gap: spacing.lg
  },
  pageHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  pageHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6
  },
  h1: {
    color: colors.textPrimary,
    fontSize: typography.h1,
    fontWeight: '800',
    lineHeight: 38,
    textAlign: 'center',
    letterSpacing: -0.8
  },
  h2: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 25
  },
  body: {
    color: colors.textPrimary,
    fontSize: typography.body,
    lineHeight: 24
  },
  secondaryText: {
    color: colors.textSecondary
  },
  caption: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.label,
    fontWeight: '700',
    marginLeft: 2
  },
  field: {
    gap: 7
  },
  input: {
    minHeight: 52,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    fontSize: typography.body,
    shadowColor: '#193C30',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 1
  },
  inputError: {
    borderColor: colors.error
  },
  error: {
    color: colors.error,
    fontSize: typography.caption,
    marginLeft: 2
  },
  button: {
    minHeight: 52,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl
  },
  primaryButton: {
    backgroundColor: colors.accent,
    shadowColor: colors.accentDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent
  },
  tertiaryButton: {
    minHeight: 42,
    backgroundColor: 'transparent'
  },
  buttonText: {
    fontSize: typography.body,
    fontWeight: '800'
  },
  primaryButtonText: {
    color: colors.surface
  },
  secondaryButtonText: {
    color: colors.accentDark
  },
  tertiaryButtonText: {
    color: colors.accentDark
  },
  disabled: {
    opacity: 0.48
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }]
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#EEF2EF',
    padding: 18,
    gap: spacing.md,
    shadowColor: '#193C30',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2
  },
  mutedCard: {
    backgroundColor: colors.surface
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent
  },
  dimension: {
    gap: spacing.sm
  },
  dimensionLabel: {
    color: colors.textPrimary,
    fontSize: typography.small,
    fontWeight: '700'
  },
  scoreText: {
    color: colors.accentDark,
    fontSize: typography.small,
    fontWeight: '800'
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft
  },
  brandHeader: {
    alignItems: 'center',
    gap: 10
  },
  brandHeaderCompact: {
    gap: 5,
    marginBottom: 4
  },
  brandText: {
    color: colors.textPrimary,
    fontSize: 39,
    lineHeight: 46,
    fontWeight: '900',
    letterSpacing: -1.5
  },
  brandTextCompact: {
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1
  },
  brandTextAccent: {
    color: colors.accent
  },
  brandTagline: {
    color: '#313834',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 8
  },
  markCanvas: {
    position: 'absolute',
    width: 72,
    height: 72
  },
  markLine: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#54B58E'
  },
  markLineA: { top: 16, left: 20, width: 31, transform: [{ rotate: '25deg' }] },
  markLineB: { top: 31, left: 9, width: 44, transform: [{ rotate: '-27deg' }] },
  markLineC: { top: 47, left: 14, width: 44, transform: [{ rotate: '30deg' }] },
  markLineD: { top: 34, left: 38, width: 34, transform: [{ rotate: '65deg' }] },
  markLineE: { top: 14, left: 38, width: 28, transform: [{ rotate: '-28deg' }] },
  markLineF: { top: 50, left: 27, width: 27, transform: [{ rotate: '-64deg' }] },
  markNode: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#092F2D'
  },
  markNodeA: { top: 6, left: 17, width: 13, height: 13, borderRadius: 7, backgroundColor: '#79C8A8' },
  markNodeB: { top: 3, left: 40, backgroundColor: '#4DB188' },
  markNodeC: { top: 19, left: 3 },
  markNodeD: { top: 16, left: 54 },
  markNodeE: { top: 32, left: 22 },
  markNodeF: { top: 29, left: 48, width: 20, height: 20, borderRadius: 10 },
  markNodeG: { top: 54, left: 13, backgroundColor: '#4DB188' },
  markNodeH: { top: 53, left: 40, width: 14, height: 14, borderRadius: 7, backgroundColor: '#4DB188' }
});
