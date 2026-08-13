import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppButton, BrandHeader, Screen } from '@/components/ui';

export default function WelcomeScreen() {
  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.hero}>
        <BrandHeader />
      </View>
      <View style={styles.actions}>
        <AppButton title="Get started" onPress={() => router.push('/(auth)/register')} />
        <AppButton title="Sign in" variant="tertiary" onPress={() => router.push('/(auth)/login')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 24
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 22
  },
  actions: {
    gap: 3,
    paddingBottom: 8
  }
});
