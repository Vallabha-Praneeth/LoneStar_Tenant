import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import colors from '../constants/colors';
import { getCampaignProofImageSource } from '../constants/supabase';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';

interface ProofThumbnailProps {
  storagePath?: string | null;
  size?: number;
  borderRadius?: number;
}

export function ProofThumbnail({
  storagePath,
  size = 48,
  borderRadius,
}: ProofThumbnailProps) {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const theme = tenant?.theme ?? colors.light;
  const radius = borderRadius ?? Math.max(8, Math.round((tenant?.radius ?? 8) / 2));
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [storagePath]);

  if (!accessToken || !storagePath || hasError) {
    return (
      <View
        style={[
          styles.placeholder,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: `${theme.primary}18`,
          },
        ]}
      >
        <Feather name="image" size={Math.max(18, Math.round(size * 0.38))} color={theme.primary} />
      </View>
    );
  }

  return (
    <Image
      source={getCampaignProofImageSource(accessToken, storagePath)}
      style={[
        styles.image,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
      ]}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: '#E2E8F0',
  },
});
