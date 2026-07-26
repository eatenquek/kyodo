import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@/constants/theme';

// editable target team size: type a number or use the +/- buttons
export function TargetSizeStepper({
  value,
  max,
  min = 2,
  onChange
}: {
  value: number;
  max: number;
  min?: number;
  onChange: (size: number) => void;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <View style={styles.row}>
      <View style={styles.control}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Decrease target team size"
          disabled={value <= min}
          onPress={() => onChange(clamp(value - 1))}
          style={({ pressed }) => [styles.button, value <= min && styles.buttonDisabled, pressed && styles.pressed]}
        >
          <Ionicons name="remove" size={16} color={value <= min ? colors.textSecondary : colors.accentDark} />
        </Pressable>

        <TextInput
          accessibilityLabel="Target team size"
          value={String(value)}
          onChangeText={(text) => {
            const n = parseInt(text.replace(/[^0-9]/g, ''), 10);
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
          keyboardType="number-pad"
          selectTextOnFocus
          style={styles.input}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Increase target team size"
          disabled={value >= max}
          onPress={() => onChange(clamp(value + 1))}
          style={({ pressed }) => [styles.button, value >= max && styles.buttonDisabled, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={16} color={value >= max ? colors.textSecondary : colors.accentDark} />
        </Pressable>
      </View>

      <Text style={styles.hint}>per team</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    overflow: 'hidden'
  },
  button: {
    width: 30,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonDisabled: { backgroundColor: '#F2F4F2' },
  input: {
    width: 34,
    height: 32,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as unknown as undefined } : null)
  },
  hint: { color: colors.textSecondary, fontSize: 12 },
  pressed: { opacity: 0.7 }
});
