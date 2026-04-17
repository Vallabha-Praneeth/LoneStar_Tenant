import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import colors from '../../constants/colors';
import { useTenant } from '../../context/TenantContext';

export default function AdminLayout() {
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
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarButtonTestID: 'admin-tab-home', tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="campaigns" options={{ title: 'Campaigns', tabBarButtonTestID: 'admin-tab-campaigns', tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} /> }} />
      <Tabs.Screen name="team" options={{ title: 'Team', tabBarButtonTestID: 'admin-tab-team', tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} /> }} />
      <Tabs.Screen name="routes" options={{ title: 'Routes', tabBarButtonTestID: 'admin-tab-routes', tabBarIcon: ({ color }) => <Feather name="map" size={22} color={color} /> }} />
      <Tabs.Screen name="analytics" options={{ title: 'Reports', tabBarButtonTestID: 'admin-tab-analytics', tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={22} color={color} /> }} />
      <Tabs.Screen name="campaign-form" options={{ href: null }} />
      <Tabs.Screen name="route-form" options={{ href: null }} />
      <Tabs.Screen name="driver-detail" options={{ href: null }} />
      <Tabs.Screen name="cost-types" options={{ href: null }} />
      <Tabs.Screen name="gallery" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="create-user" options={{ href: null }} />
    </Tabs>
  );
}
