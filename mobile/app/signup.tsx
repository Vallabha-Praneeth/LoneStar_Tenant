import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../components/ui/ThemedText';
import { Button } from '../components/ui/Button';
import { createOrganization } from '../constants/supabase';
import { bootstrapTenantSession } from '../constants/supabase';
import { useAuth } from '../context/AuthContext';

export default function SignupScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [orgName, setOrgName] = React.useState('');
  const [yourName, setYourName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  type SignupField = {
    label: string;
    value: string;
    set: React.Dispatch<React.SetStateAction<string>>;
    placeholder: string;
    testID: string;
    keyboard?: 'default' | 'email-address';
    autoCapitalize?: 'words' | 'none';
    secure?: boolean;
  };

  async function handleCreate() {
    if (!orgName.trim() || !yourName.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // createOrganization creates the org + admin user server-side and returns credentials
      await createOrganization({ orgName: orgName.trim(), adminName: yourName.trim(), email: email.trim(), password });
      // Sign in immediately with the new credentials
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create organization. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
      style={styles.root}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => router.replace('/login')}
        style={({ pressed }) => [styles.backRow, { opacity: pressed ? 0.6 : 1 }]}
        accessibilityLabel="action-back-to-login"
        testID="action-back-to-login"
      >
        <Feather name="arrow-left" size={15} color="#1B3A5C" />
        <ThemedText variant="caption" color="#1B3A5C">Back to sign in</ThemedText>
      </Pressable>

      <View style={styles.header}>
        <ThemedText variant="heading">Create your organization</ThemedText>
        <ThemedText variant="body" color="#64748B">Set up your account in under a minute.</ThemedText>
      </View>

      <View style={styles.form}>
        {([
          { label: 'Organization Name', value: orgName, set: setOrgName, placeholder: 'e.g. Apex AdTruck Co.', testID: 'input-org-name' },
          { label: 'Your Name', value: yourName, set: setYourName, placeholder: 'e.g. Sarah Miller', testID: 'input-your-name' },
          { label: 'Work Email', value: email, set: setEmail, placeholder: 'you@yourcompany.com', testID: 'input-signup-email', keyboard: 'email-address', autoCapitalize: 'none' },
          { label: 'Password', value: password, set: setPassword, placeholder: 'Min 8 characters', testID: 'input-signup-password', secure: true },
        ] as SignupField[]).map((field) => (
          <View key={field.testID} style={styles.field}>
            <ThemedText variant="label" color="#475569">{field.label}</ThemedText>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={field.value}
                onChangeText={(v) => { field.set(v as any); setError(null); }}
                placeholder={field.placeholder}
                placeholderTextColor="#94A3B8"
                secureTextEntry={field.secure}
                keyboardType={field.keyboard}
                autoCapitalize={field.autoCapitalize ?? 'words'}
                accessibilityLabel={field.testID}
                testID={field.testID}
              />
            </View>
          </View>
        ))}

        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color="#B53030" />
            <ThemedText variant="caption" color="#B53030" style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}

        <Button
          label={loading ? 'Creating…' : 'Create Organization'}
          onPress={() => void handleCreate()}
          loading={loading}
          accessibilityLabel="action-create-org"
          testID="action-create-org"
        />

        <ThemedText variant="caption" color="#94A3B8" style={styles.footerNote}>
          You'll be set up as the administrator.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F7FB' },
  content: { paddingHorizontal: 28 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 32 },
  header: { marginBottom: 28, gap: 6 },
  form: { gap: 16 },
  field: { gap: 6 },
  inputWrap: {
    borderWidth: 1,
    borderColor: '#D5E0EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  input: { fontSize: 15, fontFamily: 'Inter_400Regular', color: '#0F1F30' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
  },
  errorText: { flex: 1, lineHeight: 18 },
  footerNote: { textAlign: 'center' },
});
