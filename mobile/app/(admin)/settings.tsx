import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/ui/Card';
import { Divider } from '../../components/ui/Divider';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

interface SettingRow {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  value?: string;
  onPress?: () => void;
}

export default function AdminSettingsScreen() {
  const { user, signOut } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;

  const rows: SettingRow[] = [
    { label: 'Organization', icon: 'briefcase', value: tenant?.name },
    { label: 'Role', icon: 'shield', value: 'Administrator' },
    { label: 'Email', icon: 'mail', value: user?.email },
  ];

  const actions: SettingRow[] = [
    { label: 'Users & Roles', icon: 'users', onPress: () => undefined },
    { label: 'Notification Settings', icon: 'bell', onPress: () => undefined },
    { label: 'Integrations', icon: 'link', onPress: () => undefined },
  ];

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-admin-settings" testID="screen-admin-settings">
      <AppHeader title="Settings" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <ThemedText variant="label" color={theme.mutedForeground} style={styles.sectionTitle}>Account</ThemedText>
          {rows.map((row, index) => (
            <View key={row.label}>
              <View style={styles.row}>
                <Feather name={row.icon} size={16} color={theme.mutedForeground} />
                <View style={styles.rowContent}>
                  <ThemedText variant="label" color={theme.mutedForeground}>{row.label}</ThemedText>
                  <ThemedText variant="body">{row.value ?? '—'}</ThemedText>
                </View>
              </View>
              {index < rows.length - 1 ? <Divider inset={28} /> : null}
            </View>
          ))}
        </Card>

        <Card style={styles.section}>
          <ThemedText variant="label" color={theme.mutedForeground} style={styles.sectionTitle}>Configuration</ThemedText>
          {actions.map((row, index) => (
            <View key={row.label}>
              <Pressable onPress={row.onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
                <Feather name={row.icon} size={16} color={theme.primary} />
                <ThemedText variant="body" style={styles.actionLabel}>{row.label}</ThemedText>
                <Feather name="chevron-right" size={16} color={theme.mutedForeground} />
              </Pressable>
              {index < actions.length - 1 ? <Divider inset={28} /> : null}
            </View>
          ))}
        </Card>

        <Card padded={false}>
          <Pressable onPress={() => void handleSignOut()} style={({ pressed }) => [styles.signOutRow, { opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="log-out" size={16} color={theme.destructive} />
            <ThemedText variant="body" color={theme.destructive}>Sign out</ThemedText>
          </Pressable>
        </Card>

        <ThemedText variant="caption" color={theme.mutedForeground} style={styles.disclaimer}>
          PLACEHOLDER · Settings are not persisted. Integrations not implemented.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  section: { gap: 0 },
  sectionTitle: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  rowContent: { flex: 1 },
  actionLabel: { flex: 1 },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  disclaimer: { textAlign: 'center', marginTop: 8 },
});
