import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTenant } from '../../context/TenantContext';
import { ThemedText } from './ThemedText';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({ title, actionLabel, onAction, style }: SectionHeaderProps) {
  const { tenant } = useTenant();
  const theme = tenant?.theme;

  return (
    <View style={[styles.row, style]}>
      <ThemedText variant="subheading">{title}</ThemedText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <ThemedText variant="label" color={theme?.accent}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
