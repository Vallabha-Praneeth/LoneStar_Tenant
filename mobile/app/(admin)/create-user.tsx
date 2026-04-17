import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/ui/Button';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import colors from '../../constants/colors';
import {
  SUPABASE_ANON_KEY_VALUE,
  SUPABASE_REST_URL,
  createTenantUser,
} from '../../constants/supabase';
import type { TenantTheme } from '../../constants/tenants';
import { useAuth } from '../../context/AuthContext';
import { clearTenantOperationalDataCache } from '../../constants/tenant-operational-data';
import { useTenant } from '../../context/TenantContext';

interface ClientRow {
  id: string;
  name: string;
}

function createStyles(theme: TenantTheme, radius: number) {
  return StyleSheet.create({
    root: { flex: 1 },
    keyboardWrap: { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: 20, gap: 18, paddingBottom: 40 },
    field: { gap: 6 },
    inputWrap: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    },
    input: { fontSize: 15, fontFamily: 'Inter_400Regular', color: theme.foreground },
    clientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    clientChip: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    clientChipSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '18',
    },
    emptyClients: { paddingVertical: 8 },
    submitWrap: { marginTop: 8 },
  });
}

export default function CreateUserScreen() {
  const { role } = useLocalSearchParams<{ role: 'driver' | 'client' }>();
  const { accessToken, bootstrap } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const theme = tenant?.theme ?? colors.light;
  const radius = tenant?.radius ?? 8;
  const styles = React.useMemo(() => createStyles(theme, radius), [theme, radius]);

  const [username, setUsername] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [clientId, setClientId] = React.useState('');
  const [clients, setClients] = React.useState<ClientRow[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const orgId = bootstrap?.organization?.id;
  const isDriver = role === 'driver';
  const title = isDriver ? 'Add Driver' : 'Add Client User';

  React.useEffect(() => {
    if (!isDriver && accessToken && orgId) {
      fetch(
        `${SUPABASE_REST_URL}/clients?organization_id=eq.${orgId}&is_active=eq.true&select=id,name&order=name.asc`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY_VALUE,
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
        .then((r) => r.json())
        .then((rows: ClientRow[]) => setClients(rows))
        .catch(() => {});
    }
  }, [isDriver, accessToken, orgId]);

  async function handleSubmit() {
    if (!accessToken || !orgId) return;

    const trimmedName = displayName.trim();
    const trimmedUsername = isDriver ? username.trim() : email.trim();

    if (!trimmedName) return Alert.alert('Validation', 'Display name is required');
    if (!trimmedUsername) return Alert.alert('Validation', isDriver ? 'Username is required' : 'Email is required');
    if (password.length < 6) return Alert.alert('Validation', 'Password must be at least 6 characters');
    if (!isDriver && !clientId) return Alert.alert('Validation', 'Please select a client organization');

    setSubmitting(true);
    try {
      await createTenantUser({
        accessToken,
        organizationId: orgId,
        role: isDriver ? 'driver' : 'client',
        username: trimmedUsername,
        displayName: trimmedName,
        password,
        email: isDriver ? undefined : email.trim(),
        clientId: isDriver ? undefined : clientId,
      });
      clearTenantOperationalDataCache();
      Alert.alert('Success', `${trimmedName} has been added.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not create user.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.root}>
      <AppHeader title={title} showBack onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          {isDriver ? (
            <View style={styles.field}>
              <ThemedText variant="caption" color={theme.mutedForeground}>Username *</ThemedText>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="e.g. driver_john"
                  placeholderTextColor={theme.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          ) : (
            <View style={styles.field}>
              <ThemedText variant="caption" color={theme.mutedForeground}>Email *</ThemedText>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. jane@acme.com"
                  placeholderTextColor={theme.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
            </View>
          )}

          <View style={styles.field}>
            <ThemedText variant="caption" color={theme.mutedForeground}>Display Name *</ThemedText>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="e.g. John Smith"
                placeholderTextColor={theme.mutedForeground}
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText variant="caption" color={theme.mutedForeground}>Password *</ThemedText>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Min 6 characters"
                placeholderTextColor={theme.mutedForeground}
                secureTextEntry
              />
            </View>
          </View>

          {!isDriver && (
            <View style={styles.field}>
              <ThemedText variant="caption" color={theme.mutedForeground}>Client Organization *</ThemedText>
              {clients.length === 0 ? (
                <ThemedText variant="caption" color={theme.mutedForeground} style={styles.emptyClients}>
                  No active clients — add clients first
                </ThemedText>
              ) : (
                <View style={styles.clientGrid}>
                  {clients.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setClientId(c.id === clientId ? '' : c.id)}
                      style={({ pressed }) => [
                        styles.clientChip,
                        c.id === clientId && styles.clientChipSelected,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <ThemedText
                        variant="caption"
                        color={c.id === clientId ? theme.primary : theme.foreground}
                      >
                        {c.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.submitWrap}>
            <Button
              label={isDriver ? 'Add Driver' : 'Add Client User'}
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
