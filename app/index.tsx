import { Redirect } from 'expo-router';
import { useAppState } from '@/lib/appState';

// sends signed-in users to home instead of the welcome screen
export default function Index() {
  const { user } = useAppState();
  return <Redirect href={user ? '/(tabs)/home' : '/(auth)/welcome'} />;
}
