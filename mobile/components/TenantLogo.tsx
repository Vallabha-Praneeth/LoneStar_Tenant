import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

interface TenantLogoTenant {
  theme: {
    primary: string;
    primaryForeground: string;
  };
  logoInitials: string;
}

interface TenantLogoProps {
  tenant: TenantLogoTenant;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const SIZES = {
  sm: { container: 36, font: 14 },
  md: { container: 56, font: 22 },
  lg: { container: 80, font: 32 },
};

export function TenantLogo({ tenant, size = 'md', style }: TenantLogoProps) {
  const dim = SIZES[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: dim.container,
          height: dim.container,
          borderRadius: dim.container / 4,
          backgroundColor: tenant.theme.primary,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initials,
          { fontSize: dim.font, color: tenant.theme.primaryForeground },
        ]}
      >
        {tenant.logoInitials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
});
