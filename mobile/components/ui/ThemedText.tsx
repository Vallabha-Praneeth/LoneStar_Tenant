import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { colorsByTenant } from './theme-utils';

type Variant = 'heading' | 'subheading' | 'body' | 'caption' | 'label' | 'muted';

interface ThemedTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}

const VARIANTS: Record<Variant, TextStyle> = {
  heading: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  subheading: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.1,
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  muted: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
};

export function ThemedText({ variant = 'body', color, style, ...props }: ThemedTextProps) {
  const theme = colorsByTenant();
  const resolvedColor = color ?? ((variant === 'muted' || variant === 'caption') ? theme.mutedForeground : theme.foreground);

  return <Text style={[VARIANTS[variant], { color: resolvedColor } as TextStyle, style]} {...props} />;
}
