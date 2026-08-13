import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProvider } from '@/lib/appState';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AppProvider>
    </ErrorBoundary>
  );
}
