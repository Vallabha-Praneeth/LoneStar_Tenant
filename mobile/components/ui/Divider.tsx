import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import colors from '../../constants/colors';
import { useTenant } from '../../context/TenantContext';

interface DividerProps {
  style?: ViewStyle;
  inset?: number;
}

export function Divider({ style, inset = 0 }: DividerProps) {
  const { tenant } = useTenant();
  const borderColor = tenant?.theme.border ?? colors.light.border;

  return (
    <View
      style={[
        styles.divider,
        { borderBottomColor: borderColor, marginHorizontal: inset },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
