import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import colors from '../../constants/colors';
import { useTenant } from '../../context/TenantContext';

export default function DriverLayout() {
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
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarButtonTestID: 'driver-tab-home', tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="campaigns" options={{ title: 'Campaigns', tabBarButtonTestID: 'driver-tab-campaigns', tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} /> }} />
      <Tabs.Screen name="proofs" options={{ title: 'Proofs', tabBarButtonTestID: 'driver-tab-proofs', tabBarIcon: ({ color }) => <Feather name="camera" size={22} color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarButtonTestID: 'driver-tab-history', tabBarIcon: ({ color }) => <Feather name="clock" size={22} color={color} /> }} />
    </Tabs>
  );
}
