import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { createClientEntity } from '../../constants/supabase';
import { clearTenantOperationalDataCache } from '../../constants/tenant-operational-data';
import type { TenantTheme } from '../../constants/tenants';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

function createStyles(theme: TenantTheme, radius: number) {
  return StyleSheet.create({
    root: { flex: 1 },
    keyboardWrap: { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
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
    submitWrap: { marginTop: 8 },
  });
}

export default function ClientFormScreen() {
  const { accessToken, bootstrap } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const theme = tenant?.theme ?? colors.light;
  const radius = tenant?.radius ?? 8;
  const styles = React.useMemo(() => createStyles(theme, radius), [theme, radius]);

  const [name, setName] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const orgId = bootstrap?.organization?.id;

  async function handleCreate() {
    if (!accessToken || !orgId) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation', 'Client name is required.');
      return;
    }

    setSubmitting(true);
    try {
      await createClientEntity({
        accessToken,
        organizationId: orgId,
        name: trimmedName,
        phoneNumber,
      });

      clearTenantOperationalDataCache();
      Alert.alert('Success', 'Client entity created.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not create client entity.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.root}>
      <AppHeader title="New Client Entity" showBack onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.field}>
            <ThemedText variant="caption" color={theme.mutedForeground}>Client Name *</ThemedText>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Acme Retail"
                placeholderTextColor={theme.mutedForeground}
                autoCorrect={false}
                accessibilityLabel="input-client-name"
                testID="input-client-name"
              />
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText variant="caption" color={theme.mutedForeground}>Phone (optional)</ThemedText>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="e.g. +1 512 555 0100"
                placeholderTextColor={theme.mutedForeground}
                keyboardType="phone-pad"
                accessibilityLabel="input-client-phone"
                testID="input-client-phone"
              />
            </View>
          </View>

          <View style={styles.submitWrap}>
            <Button
              label="Create Client Entity"
              onPress={() => void handleCreate()}
              loading={submitting}
              disabled={submitting}
              accessibilityLabel="action-create-client-entity"
              testID="action-create-client-entity"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
