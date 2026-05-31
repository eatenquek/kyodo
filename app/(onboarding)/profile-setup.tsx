import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppButton, AppTextInput, Body, Card, H1, Screen, styles } from '@/components/ui';
import { preferredRoles } from '@/constants/questions';
import { colors, radius, spacing } from '@/constants/theme';
import { useAppState } from '@/lib/appState';

export default function ProfileSetupScreen() {
  const { profile, saveProfile } = useAppState();
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [university, setUniversity] = useState(profile?.university ?? 'NUS');
  const [course, setCourse] = useState(profile?.course ?? '');
  const [year, setYear] = useState(String(profile?.yearOfStudy ?? 1));
  const [role, setRole] = useState(profile?.preferredRole ?? 'Builder');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    try {
      setSaving(true);
      setError('');
      await saveProfile({ fullName, university, course, yearOfStudy: Number(year), preferredRole: role, bio });
      router.push('/(onboarding)/questionnaire-intro');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile. Check your Supabase setup and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <H1>Set up your profile</H1>
      <Body secondary>Keep it practical. This context helps the team view feel real without getting overly personal.</Body>
      {error ? (
        <Card muted>
          <Body secondary>{error}</Body>
        </Card>
      ) : null}
      <AppTextInput label="Full name" value={fullName} onChangeText={setFullName} placeholder="Ethan Quek" />
      <AppTextInput label="University" value={university} onChangeText={setUniversity} placeholder="NUS" />
      <AppTextInput label="Course / major" value={course} onChangeText={setCourse} placeholder="Computer Science" />
      <AppTextInput label="Year of study" value={year} onChangeText={setYear} keyboardType="number-pad" />
      <Card>
        <Body secondary>Preferred project role</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {preferredRoles.map((item) => (
            <Pressable
              key={item}
              onPress={() => setRole(item)}
              style={{
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: role === item ? colors.accent : colors.border,
                backgroundColor: role === item ? colors.accentSoft : colors.surface,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm
              }}
            >
              <Text style={[styles.label, { color: role === item ? colors.accent : colors.textPrimary }]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
      <AppTextInput label="Short bio" value={bio} onChangeText={setBio} placeholder="I like prototyping and organizing tasks." multiline />
      <AppButton title="Save and continue" onPress={submit} disabled={!fullName || !role} loading={saving} />
    </Screen>
  );
}
