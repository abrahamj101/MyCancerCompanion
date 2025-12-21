import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import { Tabs } from 'expo-router';
import { Calendar, ClipboardPen, Users } from 'lucide-react-native';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#3b82f6' : '#2563eb',
        tabBarInactiveTintColor: isDark ? '#6b7280' : '#9ca3af',
        tabBarStyle: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: isDark ? '#111827' : '#ffffff',
        },
        headerTintColor: isDark ? '#ffffff' : '#111827',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Appointments',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Calendar size={size || 24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Log',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <ClipboardPen size={size || 24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="three"
        options={{
          title: 'Community',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Users size={size || 24} color={color} />,
        }}
      />
    </Tabs>
  );
}
