import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { colorsByTenant, radiusByTenant } from './theme-utils';

interface CardProps extends ViewProps {
  padded?: boolean;
}

export function Card({ padded = true, style, children, ...props }: CardProps) {
  const theme = colorsByTenant();
  const radius = radiusByTenant();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderRadius: radius,
          padding: padded ? 16 : 0,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
});
