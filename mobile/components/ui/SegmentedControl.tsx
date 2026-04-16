import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTenant } from '../../context/TenantContext';
import { ThemedText } from './ThemedText';

interface Segment<T extends string> {
  key: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const { tenant } = useTenant();
  const theme = tenant?.theme;
  const radius = tenant?.radius ?? 8;

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: theme?.border,
          borderRadius: radius,
        },
        style,
      ]}
    >
      {segments.map((segment) => {
        const active = segment.key === value;
        return (
          <Pressable
            key={segment.key}
            onPress={() => onChange(segment.key)}
            style={[
              styles.segment,
              {
                backgroundColor: active ? theme?.card : 'transparent',
                borderRadius: Math.max(0, radius - 2),
              },
            ]}
          >
            <ThemedText variant="label" color={active ? theme?.foreground : theme?.mutedForeground}>
              {segment.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
