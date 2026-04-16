import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colorsByTenant } from './theme-utils';

interface ProgressBarProps {
  value: number;
  style?: ViewStyle;
  height?: number;
}

export function ProgressBar({ value, style, height = 6 }: ProgressBarProps) {
  const theme = colorsByTenant();
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: theme.border, height, borderRadius: height / 2 },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: theme.primary,
            height,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {},
});
