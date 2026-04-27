import React from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { getBrandingLogoImageSource } from '../constants/supabase';
import { useAuth } from '../context/AuthContext';

interface TenantLogoTenant {
  theme: {
    primary: string;
    primaryForeground: string;
  };
  logoInitials: string;
  logoUrl: string;
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
  const { accessToken } = useAuth();
  const dim = SIZES[size];
  const [hasImageError, setHasImageError] = React.useState(false);
  const showLogoImage = Boolean(accessToken && tenant.logoUrl && !hasImageError);

  React.useEffect(() => {
    setHasImageError(false);
  }, [tenant.logoUrl]);

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
      {showLogoImage ? (
        <Image
          source={getBrandingLogoImageSource(accessToken!, tenant.logoUrl)}
          style={[styles.logoImage, { borderRadius: dim.container / 4 }]}
          resizeMode="cover"
          onError={() => setHasImageError(true)}
        />
      ) : null}
      <Text
        style={[
          styles.initials,
          { fontSize: dim.font, color: tenant.theme.primaryForeground },
          showLogoImage ? styles.hiddenText : null,
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
  logoImage: {
    ...StyleSheet.absoluteFillObject,
  },
  hiddenText: {
    opacity: 0,
  },
});
