import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import colors from '../constants/colors';
import { useTenant } from '../context/TenantContext';

interface AvatarBadgeProps {
  initials: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function AvatarBadge({ initials, size = 36, color, style }: AvatarBadgeProps) {
  const { tenant } = useTenant();
  const theme = tenant?.theme ?? colors.light;
  const bg = color ?? `${theme.primary}22`;
  const fg = color ? theme.primaryForeground : theme.primary;

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.36, color: fg }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
});
