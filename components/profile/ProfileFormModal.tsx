import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { AppButton, AppTextInput } from '@/components/ui';
import { preferredRoles } from '@/constants/questions';
import { colors } from '@/constants/theme';
import { useAppState } from '@/lib/appState';
import { AvailabilityBlock, Profile } from '@/types/domain';
import { availabilityBlocks } from '@/services/scoring/availability';

export function ProfileFormModal({
  visible,
  profile,
  onClose
}: {
  visible: boolean;
  profile: Profile | null;
  onClose: () => void;
}) {
  const { saveProfile } = useAppState();
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [preferredRole, setPreferredRole] = useState('Flexible');
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFullName(profile?.fullName ?? '');
    setUniversity(profile?.university ?? '');
    setCourse(profile?.course ?? '');
    setYear(profile?.yearOfStudy?.toString() ?? '');
    setPreferredRole(profile?.preferredRole ?? 'Flexible');
    setAvailability(profile?.availability ?? []);
    setBio(profile?.bio ?? '');
    setError('');
  }, [profile, visible]);

  function close() {
    if (!loading) onClose();
  }

  async function submit() {
    if (!fullName.trim()) {
      setError('Add your full name to save your profile.');
      return;
    }

    const yearOfStudy = year ? Number(year) : undefined;
    if (yearOfStudy && (yearOfStudy < 1 || yearOfStudy > 8)) {
      setError('Year of study must be between 1 and 8.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await saveProfile({
        fullName: fullName.trim(),
        university: university.trim() || undefined,
        course: course.trim() || undefined,
        yearOfStudy,
        preferredRole,
        availability,
        bio: bio.trim() || undefined
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close profile form" onPress={close} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>YOUR DETAILS</Text>
              <Text style={styles.title}>{profile ? 'Edit profile' : 'Complete profile'}</Text>
            </View>
            <Pressable accessibilityLabel="Close" hitSlop={10} onPress={close} style={styles.closeButton}>
              <Ionicons name="close" size={23} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
            <AppTextInput
              label="Full name"
              placeholder="Your name"
              value={fullName}
              onChangeText={(value) => {
                setFullName(value);
                setError('');
              }}
            />
            <AppTextInput label="University" placeholder="e.g. NUS" value={university} onChangeText={setUniversity} />
            <AppTextInput label="Course" placeholder="e.g. Computer Science" value={course} onChangeText={setCourse} />
            <AppTextInput
              label="Year of study"
              placeholder="1–8"
              value={year}
              onChangeText={(value) => setYear(value.replace(/[^0-9]/g, '').slice(0, 1))}
              keyboardType="number-pad"
            />

            <View style={styles.roleField}>
              <Text style={styles.label}>Preferred team role</Text>
              <View style={styles.roleGrid}>
                {preferredRoles.map((role) => {
                  const selected = role === preferredRole;
                  return (
                    <Pressable
                      key={role}
                      onPress={() => setPreferredRole(role)}
                      style={({ pressed }) => [styles.roleChip, selected && styles.roleChipSelected, pressed && styles.pressed]}
                    >
                      <Text style={[styles.roleText, selected && styles.roleTextSelected]}>{role}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.roleField}>
              <Text style={styles.label}>When are you usually free?</Text>
              <Text style={styles.availabilityHelp}>
                Used to find a meeting slot your team actually shares. Pick as many as apply.
              </Text>
              <View style={styles.roleGrid}>
                {availabilityBlocks.map((block) => {
                  const selected = availability.includes(block.id);
                  return (
                    <Pressable
                      key={block.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={block.label}
                      onPress={() =>
                        setAvailability((current) =>
                          current.includes(block.id)
                            ? current.filter((item) => item !== block.id)
                            : [...current, block.id]
                        )
                      }
                      style={({ pressed }) => [styles.roleChip, selected && styles.roleChipSelected, pressed && styles.pressed]}
                    >
                      <Text style={[styles.roleText, selected && styles.roleTextSelected]}>{block.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <AppTextInput
              label="Short bio"
              placeholder="How do you like to work with a team?"
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={220}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <AppButton title="Save profile" loading={loading} disabled={!fullName.trim()} onPress={() => void submit()} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17, 28, 22, 0.42)' },
  sheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 17
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
  form: { gap: 15, paddingBottom: 8 },
  roleField: { gap: 9 },
  availabilityHelp: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: -4 },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginLeft: 2 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: {
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  roleChipSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  roleText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  roleTextSelected: { color: colors.accentDark, fontWeight: '800' },
  error: { color: colors.error, fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] }
});
