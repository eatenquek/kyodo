import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentDark,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border }
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home-outline" color={color} size={22} /> }} />
      <Tabs.Screen name="teams" options={{ title: 'Teams', tabBarIcon: ({ color }) => <Ionicons name="people-outline" color={color} size={22} /> }} />
      <Tabs.Screen name="cohort" options={{ title: 'Cohort', tabBarIcon: ({ color }) => <Ionicons name="school-outline" color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person-outline" color={color} size={22} /> }} />
    </Tabs>
  );
}
