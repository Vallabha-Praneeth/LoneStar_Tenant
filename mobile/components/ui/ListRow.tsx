import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTenant } from '../../context/TenantContext';
import { Divider } from './Divider';
import { ThemedText } from './ThemedText';

interface ListRowProps {
  title: string;
  subtitle?: string;
  meta?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
  style?: ViewStyle;
}

export function ListRow({
  title,
  subtitle,
  meta,
  leading,
  trailing,
  onPress,
  showDivider = true,
  style,
}: ListRowProps) {
  const { tenant } = useTenant();
  const theme = tenant?.theme;

  const inner = (
    <View style={[styles.row, style]}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <ThemedText variant="label" style={styles.title} numberOfLines={1}>
            {title}
          </ThemedText>
          {meta ? (
            <ThemedText variant="caption" color={theme?.mutedForeground}>
              {meta}
            </ThemedText>
          ) : null}
        </View>
        {subtitle ? (
          <ThemedText variant="caption" color={theme?.mutedForeground} numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {trailing !== undefined ? trailing : onPress ? <Feather name="chevron-right" size={16} color={theme?.mutedForeground} /> : null}
    </View>
  );

  return (
    <>
      {onPress ? (
        <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
          {inner}
        </Pressable>
      ) : inner}
      {showDivider && <Divider inset={leading ? 54 : 0} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
    minHeight: 52,
  },
  leading: {
    width: 38,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
  },
});
