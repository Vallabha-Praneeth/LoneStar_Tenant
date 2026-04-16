import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import colors from '../../constants/colors';
import { useTenant } from '../../context/TenantContext';

export default function ClientLayout() {
  const { tenant } = useTenant();
  const theme = tenant?.theme ?? colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          ...(Platform.OS === 'web' ? { height: 84 } : {}),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_500Medium',
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Dashboard', tabBarButtonTestID: 'client-tab-home', tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="campaigns" options={{ title: 'Campaigns', tabBarButtonTestID: 'client-tab-campaigns', tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} /> }} />
      <Tabs.Screen name="gallery" options={{ title: 'Gallery', tabBarButtonTestID: 'client-tab-gallery', tabBarIcon: ({ color }) => <Feather name="image" size={22} color={color} /> }} />
      <Tabs.Screen name="timeline" options={{ title: 'Timeline', tabBarButtonTestID: 'client-tab-timeline', tabBarIcon: ({ color }) => <Feather name="trending-up" size={22} color={color} /> }} />
    </Tabs>
  );
}
