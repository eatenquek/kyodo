import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/constants/theme';

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const content = <View style={styles.screenInner}>{children}</View>;
  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.paperTop} />
        <View style={styles.tornEdge}>
          {Array.from({ length: 9 }).map((_, index) => (
            <View key={index} style={[styles.tornDot, { left: `${index * 12 - 2}%`, top: index % 2 ? -6 : -1 }]} />
          ))}
        </View>
        <View style={styles.mintWash}>
          <View style={styles.washStrokeOne} />
          <View style={styles.washStrokeTwo} />
        </View>
      </View>
      {scroll ? <ScrollView contentContainerStyle={styles.scrollContent}>{content}</ScrollView> : content}
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
      <TextInput placeholderTextColor={colors.textSecondary} style={[styles.input, Boolean(error) && styles.inputError]} {...props} />
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
      <Ionicons name="sparkles-outline" size={24} color={colors.info} />
      <H2>{title}</H2>
      <Body secondary>{body}</Body>
      {actionLabel ? <AppButton title={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </Card>
  );
}

export function BrandHeader({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.brandHeader, compact && styles.brandHeaderCompact]}>
      <View style={styles.brandDots}>
        <View style={styles.brandDotCluster}>
          <View style={styles.brandDot} />
          <View style={styles.brandDot} />
          <View style={styles.brandDot} />
        </View>
        <View style={styles.brandDotCluster}>
          <View style={styles.brandDot} />
          <View style={styles.brandDot} />
          <View style={styles.brandDot} />
        </View>
      </View>
      <View style={styles.logoRow}>
        <MoleculeMark />
        <Text style={styles.brandText}>
          Kyodo<Text style={styles.brandTextAccent}>AI</Text>
        </Text>
      </View>
      <Text style={styles.brandSubhead}>Ethan and{'\n'}Malvika Inc.</Text>
    </View>
  );
}

function MoleculeMark() {
  return (
    <View style={styles.mark}>
      <View style={[styles.markLine, styles.markLineA]} />
      <View style={[styles.markLine, styles.markLineB]} />
      <View style={[styles.markLine, styles.markLineC]} />
      <View style={[styles.markLine, styles.markLineD]} />
      <View style={[styles.markNode, styles.markNodeA]} />
      <View style={[styles.markNode, styles.markNodeB]} />
      <View style={[styles.markNode, styles.markNodeC]} />
      <View style={[styles.markNode, styles.markNodeD]} />
      <View style={[styles.markNode, styles.markNodeE]} />
    </View>
  );
}

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  background: { ...StyleSheet.absoluteFillObject },
  paperTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 178, backgroundColor: colors.surface },
  tornEdge: { position: 'absolute', top: 166, left: 0, right: 0, height: 26, overflow: 'hidden' },
  tornDot: {
    position: 'absolute',
    width: 72,
    height: 32,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(49, 90, 82, 0.12)'
  },
  mintWash: { position: 'absolute', top: 178, left: 0, right: 0, bottom: 0, backgroundColor: colors.wash },
  washStrokeOne: {
    position: 'absolute',
    top: 70,
    left: -70,
    width: 460,
    height: 90,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    transform: [{ rotate: '-18deg' }]
  },
  washStrokeTwo: {
    position: 'absolute',
    bottom: 120,
    right: -120,
    width: 480,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(62, 128, 104, 0.10)',
    transform: [{ rotate: '24deg' }]
  },
  scrollContent: { flexGrow: 1 },
  screenInner: { flex: 1, paddingHorizontal: 30, paddingTop: 26, paddingBottom: 28, gap: spacing.lg },
  h1: { color: colors.textPrimary, fontSize: typography.h1, fontWeight: '800', lineHeight: 36, textAlign: 'center' },
  h2: { color: colors.textPrimary, fontSize: typography.h2, fontWeight: '800', lineHeight: 28 },
  body: { color: colors.textPrimary, fontSize: typography.body, lineHeight: 24 },
  secondaryText: { color: colors.textSecondary },
  caption: { color: colors.textSecondary, fontSize: typography.caption, lineHeight: 18 },
  label: { color: colors.textPrimary, fontSize: typography.label, fontWeight: '800' },
  field: { gap: spacing.sm },
  input: {
    minHeight: 44,
    borderRadius: radius.input,
    borderWidth: 0,
    backgroundColor: colors.accentLight,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    fontSize: typography.body,
    textAlign: 'center'
  },
  inputError: { borderWidth: 2, borderColor: colors.error },
  error: { color: colors.error, fontSize: typography.caption },
  button: {
    minHeight: 44,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl
  },
  primaryButton: { backgroundColor: colors.accentDark },
  secondaryButton: { backgroundColor: colors.accentLight, borderWidth: 0 },
  tertiaryButton: { backgroundColor: 'transparent' },
  buttonText: { fontSize: typography.body, fontWeight: '900' },
  primaryButtonText: { color: colors.surface },
  secondaryButtonText: { color: colors.accentDark },
  tertiaryButtonText: { color: colors.accentDark },
  disabled: { opacity: 0.55 },
  pressed: { transform: [{ scale: 0.98 }] },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.88)',
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.accentDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2
  },
  mutedCard: { backgroundColor: 'rgba(255, 255, 255, 0.62)' },
  progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: 'rgba(255, 255, 255, 0.72)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accentDark },
  dimension: { gap: spacing.sm },
  dimensionLabel: { color: colors.textPrimary, fontSize: typography.small, fontWeight: '700' },
  scoreText: { color: colors.accentDark, fontSize: typography.small, fontWeight: '800' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  brandHeader: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  brandHeaderCompact: { marginBottom: spacing.sm, transform: [{ scale: 0.9 }] },
  brandDots: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  brandDotCluster: { flexDirection: 'row', gap: 5 },
  brandDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  brandText: { color: colors.textPrimary, fontSize: typography.display, fontWeight: '900', letterSpacing: 0 },
  brandTextAccent: { color: colors.accentLight },
  brandSubhead: { color: colors.accent, fontSize: typography.small, fontWeight: '900', lineHeight: 15, textAlign: 'center' },
  mark: { width: 58, height: 58 },
  markLine: { position: 'absolute', height: 5, borderRadius: 3, backgroundColor: colors.accentLight },
  markLineA: { top: 14, left: 12, width: 34, transform: [{ rotate: '30deg' }] },
  markLineB: { top: 28, left: 8, width: 42, transform: [{ rotate: '-28deg' }] },
  markLineC: { top: 24, left: 26, width: 30, transform: [{ rotate: '62deg' }] },
  markLineD: { top: 36, left: 14, width: 28, transform: [{ rotate: '22deg' }] },
  markNode: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentDark },
  markNodeA: { top: 10, left: 11 },
  markNodeB: { top: 8, left: 36, backgroundColor: colors.accentLight },
  markNodeC: { top: 26, left: 3 },
  markNodeD: { top: 28, left: 43 },
  markNodeE: { top: 42, left: 24, backgroundColor: colors.accentLight }
});
