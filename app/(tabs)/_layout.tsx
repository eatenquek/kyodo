import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';

const tabs = [
  { name: 'home', title: 'Home', icon: 'home-outline' },
  { name: 'teams', title: 'Teams', icon: 'people-outline' },
  { name: 'cohort', title: 'Cohort', icon: 'school-outline' },
  { name: 'profile', title: 'Profile', icon: 'person-outline' }
] as const;

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
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: ({ color }) => <Ionicons name={tab.icon} color={color} size={22} />
          }}
        />
      ))}
    </Tabs>
  );
}
