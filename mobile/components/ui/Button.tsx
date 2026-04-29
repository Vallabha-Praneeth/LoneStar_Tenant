import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colorsByTenant, radiusByTenant } from './theme-utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const theme = colorsByTenant();
  const radius = radiusByTenant();
  const containerStyle = buildContainerStyle(variant, size, theme, radius);
  const textStyle = buildTextStyle(variant, size, theme);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        containerStyle,
        { opacity: pressed || isDisabled ? 0.65 : 1 },
        style as ViewStyle,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? theme.primaryForeground : theme.primary} />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </Pressable>
  );
}

function buildContainerStyle(
  variant: Variant,
  size: Size,
  theme: ReturnType<typeof colorsByTenant>,
  radius: number,
): ViewStyle {
  const padding = size === 'sm' ? 10 : size === 'md' ? 14 : 18;
  const base: ViewStyle = {
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: padding,
    paddingHorizontal: padding * 1.6,
  };

  switch (variant) {
    case 'primary':
      return { ...base, backgroundColor: theme.primary };
    case 'secondary':
      return { ...base, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border };
    case 'outline':
      return { ...base, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.primary };
    case 'ghost':
      return { ...base, backgroundColor: 'transparent' };
    case 'destructive':
      return { ...base, backgroundColor: theme.destructive };
  }
}

function buildTextStyle(
  variant: Variant,
  size: Size,
  theme: ReturnType<typeof colorsByTenant>,
): TextStyle {
  const fontSize = size === 'sm' ? 13 : size === 'md' ? 15 : 17;
  const base: TextStyle = {
    fontSize,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.1,
  };

  switch (variant) {
    case 'primary':
      return { ...base, color: theme.primaryForeground };
    case 'secondary':
      return { ...base, color: theme.foreground };
    case 'outline':
      return { ...base, color: theme.primary };
    case 'ghost':
      return { ...base, color: theme.primary };
    case 'destructive':
      return { ...base, color: theme.primaryForeground };
  }
}
