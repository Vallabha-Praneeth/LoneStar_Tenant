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
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await signIn(email.trim(), password);
      if (!user) {
        setError('No account found for these credentials.');
        return;
      }
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        style={styles.root}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText variant="heading" style={styles.appName}>Campaign Proof</ThemedText>
          <ThemedText variant="body" color="#64748B" style={styles.sub}>Sign in to your organization</ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <ThemedText variant="label" color="#475569">Email</ThemedText>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(null); }}
                placeholder="you@yourcompany.com"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                accessibilityLabel="input-login-email"
                testID="input-login-email"
              />
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText variant="label" color="#475569">Password</ThemedText>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(null); }}
                placeholder="Your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                onSubmitEditing={() => void handleSignIn()}
                returnKeyType="go"
                accessibilityLabel="input-login-password"
                testID="input-login-password"
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={14} color="#B53030" />
              <ThemedText variant="caption" color="#B53030" style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}

          <Button
            label={loading ? 'Signing in…' : 'Sign In'}
            onPress={() => void handleSignIn()}
            loading={loading}
            accessibilityLabel="action-login-submit"
            testID="action-login-submit"
          />

          <Pressable
            onPress={() => router.push('/signup')}
            style={({ pressed }) => [styles.signupLink, { opacity: pressed ? 0.6 : 1 }]}
            accessibilityLabel="action-go-to-signup"
            testID="action-go-to-signup"
          >
            <ThemedText variant="caption" color="#1B3A5C">New here? Create your organization →</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F7FB' },
  content: { paddingHorizontal: 28 },
  header: { marginBottom: 40, gap: 6 },
  appName: { fontSize: 28, letterSpacing: -0.5 },
  sub: { lineHeight: 22 },
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
  signupLink: { alignItems: 'center', paddingVertical: 8 },
});
