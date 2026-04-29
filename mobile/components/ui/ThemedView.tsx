import React from 'react';
import { View, type ViewProps } from 'react-native';
import { colorsByTenant } from './theme-utils';

interface ThemedViewProps extends ViewProps {
  surface?: boolean;
}

export function ThemedView({ surface, style, ...props }: ThemedViewProps) {
  const theme = colorsByTenant();

  return (
    <View
      style={[{ backgroundColor: surface ? theme.card : theme.background }, style]}
      {...props}
    />
  );
}
