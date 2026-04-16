import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TenantLogo } from '../components/TenantLogo';
import { Button } from '../components/ui/Button';
import { ThemedText } from '../components/ui/ThemedText';
import { DEMO_ACCOUNTS, type UserRole } from '../constants/mockData';
import colors from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  driver: 'Driver',
  client: 'Client',
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Manage campaigns, team, and reports',
  driver: 'View shifts and upload proofs',
  client: 'Track campaign progress and proofs',
};

export default function LoginScreen() {
  const { tenant, clearTenant, isLoading: tenantLoading } = useTenant();
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [selectedRole, setSelectedRole] = React.useState<UserRole>('admin');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (tenantLoading) {
    return (
      <View
        style={styles.center}
        accessibilityLabel="screen-login-loading"
        testID="screen-login-loading"
      >
        <ActivityIndicator size="large" color="#1B3A5C" />
      </View>
    );
  }

  if (!tenant) {
    return (
      <View
        style={[styles.center, { paddingTop: topPad }]}
        accessibilityLabel="screen-login-invalid-org"
        testID="screen-login-invalid-org"
      >
        <Feather name="alert-triangle" size={36} color="#B53030" />
        <ThemedText variant="subheading" style={styles.centerText}>
          Organization not found
        </ThemedText>
        <ThemedText variant="body" color="#64748B" style={styles.centerText}>
          The selected organization could not be resolved. Go back and choose a valid organization.
        </ThemedText>
        <Pressable
          onPress={() => {
            void clearTenant();
            router.replace('/');
          }}
          accessibilityLabel="action-choose-organization"
          testID="action-choose-organization"
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="arrow-left" size={14} color="#1B3A5C" />
          <ThemedText variant="label" color="#1B3A5C">
            Choose organization
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  const activeTenant = tenant;
  const theme = activeTenant.theme;

  async function handleLogin() {
    setError(null);
    if (!password.trim()) {
      setError('Enter the demo password to continue.');
      return;
    }
    setLoading(true);
    try {
      const user = await signIn(selectedRole, activeTenant.slug, password);
      if (!user) {
        setError(`No ${ROLE_LABELS[selectedRole]} account found for ${activeTenant.name}.`);
        return;
      }
      router.replace(`/${groupForRole(selectedRole)}/home`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={[styles.root, { backgroundColor: theme.background }]}
      accessibilityLabel="screen-login"
      testID="screen-login"
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 24, paddingBottom: botPad + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => {
            void clearTenant();
            router.replace('/');
          }}
          accessibilityLabel="action-change-org"
          testID="action-change-org"
          style={({ pressed }) => [styles.backRow, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={15} color={theme.mutedForeground} />
          <ThemedText variant="caption" color={theme.mutedForeground}>
            Change organization
          </ThemedText>
        </Pressable>

        <View style={styles.brand}>
          <TenantLogo tenant={activeTenant} size="lg" />
          <ThemedText variant="heading" style={styles.centerText}>
            {activeTenant.name}
          </ThemedText>
          <ThemedText variant="body" color={theme.mutedForeground} style={styles.centerText}>
            {activeTenant.tagline}
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText variant="label" color={theme.mutedForeground}>
            Sign in as
          </ThemedText>

          <View style={styles.roleGrid}>
            {DEMO_ACCOUNTS.map((account) => {
              const active = selectedRole === account.role;
              return (
                <Pressable
                  key={account.role}
                  onPress={() => {
                    setSelectedRole(account.role);
                    setError(null);
                  }}
                  accessibilityLabel={`role-option-${account.role}`}
                  testID={`role-option-${account.role}`}
                  style={({ pressed }) => [
                    styles.roleCard,
                    {
                      backgroundColor: active ? theme.primary : theme.card,
                      borderColor: active ? theme.primary : theme.border,
                      borderRadius: activeTenant.radius,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <ThemedText variant="label" color={active ? theme.primaryForeground : theme.foreground}>
                    {account.label}
                  </ThemedText>
                  <ThemedText
                    variant="caption"
                    color={active ? `${theme.primaryForeground}CC` : theme.mutedForeground}
                    style={styles.roleDesc}
                  >
                    {ROLE_DESCRIPTIONS[account.role]}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.fields}>
            <View style={styles.fieldGroup}>
              <ThemedText variant="label" color={theme.mutedForeground}>
                Email
              </ThemedText>
              <View
                style={[
                  styles.inputWrap,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.card,
                    borderRadius: activeTenant.radius,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.mutedForeground }]}
                  value={`${selectedRole}@${tenant.slug}.demo`}
                  editable={false}
                  selectTextOnFocus={false}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText variant="label" color={theme.mutedForeground}>
                Password
              </ThemedText>
              <View
                style={[
                  styles.inputWrap,
                  {
                    borderColor: error ? theme.destructive : theme.border,
                    backgroundColor: theme.card,
                    borderRadius: activeTenant.radius,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.foreground }]}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setError(null);
                  }}
                  accessibilityLabel="input-login-password"
                  testID="input-login-password"
                  secureTextEntry
                  placeholder="Enter demo password"
                  placeholderTextColor={theme.mutedForeground}
                  onSubmitEditing={() => void handleLogin()}
                  returnKeyType="go"
                />
              </View>
            </View>
          </View>

          {error ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: `${theme.destructive}14`,
                  borderColor: `${theme.destructive}40`,
                  borderRadius: tenant.radius,
                },
              ]}
            >
              <Feather name="alert-circle" size={14} color={theme.destructive} />
              <ThemedText variant="caption" color={theme.destructive} style={styles.errorBannerText}>
                {error}
              </ThemedText>
            </View>
          ) : null}

          <Button
            label={loading ? 'Signing in...' : `Continue as ${ROLE_LABELS[selectedRole]}`}
            onPress={() => void handleLogin()}
            loading={loading}
            accessibilityLabel="action-login-continue"
            testID="action-login-continue"
          />

          <ThemedText variant="caption" color={theme.mutedForeground} style={styles.centerText}>
            DEMO · Live Supabase login · Password: Demo123!
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

function groupForRole(role: UserRole) {
  return role === 'admin' ? '(admin)' : role === 'driver' ? '(driver)' : '(client)';
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
    backgroundColor: '#F8FAFC',
  },
  centerText: {
    textAlign: 'center',
  },
  content: { paddingHorizontal: 24 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 32,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EFF3F7',
    borderRadius: 8,
    marginTop: 8,
  },
  brand: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  form: {
    gap: 14,
  },
  roleGrid: {
    gap: 10,
  },
  roleCard: {
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  roleDesc: {
    lineHeight: 18,
  },
  fields: {
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  inputWrap: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderWidth: 1,
  },
  errorBannerText: {
    flex: 1,
    lineHeight: 18,
  },
});
