import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import colors from '../../constants/colors';
import { useTenant } from '../../context/TenantContext';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: '#EFF3F7', text: '#1B3A5C' },
  success: { bg: '#DCFCE7', text: '#166534' },
  warning: { bg: '#FEF9C3', text: '#854D0E' },
  error: { bg: '#FEE2E2', text: '#991B1B' },
  neutral: { bg: '#F1F5F9', text: '#64748B' },
};

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const { tenant } = useTenant();
  const { bg, text } = variant === 'default'
    ? {
        bg: `${tenant?.theme.accent ?? colors.light.accent}22`,
        text: tenant?.theme.accent ?? colors.light.accent,
      }
    : VARIANT_COLORS[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});
