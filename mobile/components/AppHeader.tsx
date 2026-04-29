import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { TenantLogo } from './TenantLogo';
import { ThemedText } from './ui/ThemedText';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function AppHeader({ title, showBack, onBack, rightAction }: AppHeaderProps) {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = tenant?.theme ?? colors.light;
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPadding + 8,
          backgroundColor: theme.card,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={styles.inner}>
        <View style={styles.left}>
          {showBack ? (
            <Pressable
              onPress={onBack}
              accessibilityLabel="app-header-back"
              testID="app-header-back"
              style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Feather name="arrow-left" size={22} color={theme.foreground} />
            </Pressable>
          ) : tenant ? (
            <TenantLogo tenant={tenant} size="sm" />
          ) : null}
        </View>

        <ThemedText variant="subheading" numberOfLines={1} style={styles.title}>
          {title ?? tenant?.name ?? user?.name ?? ''}
        </ThemedText>

        <View style={styles.right}>{rightAction ?? null}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    minHeight: 40,
  },
  left: {
    width: 36,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  right: {
    minWidth: 36,
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  back: {
    padding: 4,
    marginLeft: -4,
  },
});
