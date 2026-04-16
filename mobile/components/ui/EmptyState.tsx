import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTenant } from '../../context/TenantContext';
import { Button } from './Button';
import { ThemedText } from './ThemedText';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { tenant } = useTenant();
  const theme = tenant?.theme;

  return (
    <View style={[styles.root, style]}>
      <Feather name={icon} size={36} color={theme?.mutedForeground} />
      <ThemedText variant="subheading" style={styles.title}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText variant="body" color={theme?.mutedForeground} style={styles.message}>
          {message}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="sm"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 10,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {
    marginTop: 4,
  },
});
