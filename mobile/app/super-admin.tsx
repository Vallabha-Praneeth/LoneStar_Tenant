import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { ThemedText } from '../components/ui/ThemedText';
import {
  listInviteCodes,
  resendInviteCode,
  sendInviteCode,
  signInWithPassword,
  type SuperAdminInviteRecord,
} from '../constants/supabase';

type InviteBadgeStyleKey = `badge_${SuperAdminInviteRecord['status']}`;

// Decodes a JWT payload without verifying the signature. Only used to read
// the local copy of app_metadata.platform_role so we can surface a clear
// error when a non-super-admin account signs in here. The server-side
// edge functions still enforce the platform_role check authoritatively.
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const [, payload] = jwt.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = globalThis.atob ? globalThis.atob(padded) : null;
    if (!decoded) return null;
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function formatTimestamp(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function SuperAdminScreen() {
  const insets = useSafeAreaInsets();

  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [authLoading, setAuthLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const [invites, setInvites] = React.useState<SuperAdminInviteRecord[]>([]);
  const [listLoading, setListLoading] = React.useState(false);
  const [listError, setListError] = React.useState<string | null>(null);
  const [note, setNote] = React.useState('');
  const [createLoading, setCreateLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [lastCode, setLastCode] = React.useState<string | null>(null);

  const refresh = React.useCallback(
    async (token: string) => {
      setListLoading(true);
      setListError(null);
      try {
        const rows = await listInviteCodes(token);
        setInvites(rows);
      } catch (err) {
        setListError(err instanceof Error ? err.message : 'Could not load invite codes.');
      } finally {
        setListLoading(false);
      }
    },
    [],
  );

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setAuthError('Enter email and password.');
      return;
    }
    setAuthError(null);
    setAuthLoading(true);
    try {
      const session = await signInWithPassword(email.trim(), password);
      const payload = decodeJwtPayload(session.access_token);
      const appMetadata = (payload?.app_metadata ?? {}) as Record<string, unknown>;
      if (appMetadata.platform_role !== 'super_admin') {
        setAuthError('This account is not a super-admin.');
        return;
      }
      setAccessToken(session.access_token);
      setPassword('');
      await refresh(session.access_token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleCreateInvite() {
    if (!accessToken) return;
    setActionError(null);
    setCreateLoading(true);
    setLastCode(null);
    try {
      const invite = await sendInviteCode({ accessToken, note: note.trim() || undefined });
      setLastCode(invite.code);
      setNote('');
      await refresh(accessToken);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not create invite.');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleResend(inviteId: string) {
    if (!accessToken) return;
    setActionError(null);
    try {
      const invite = await resendInviteCode({ accessToken, inviteId });
      setLastCode(invite.code);
      await refresh(accessToken);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not resend invite.');
    }
  }

  function handleSignOut() {
    setAccessToken(null);
    setInvites([]);
    setLastCode(null);
    setActionError(null);
  }

  if (!accessToken) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}>
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
          <ThemedText variant="heading">Super-admin</ThemedText>
          <ThemedText variant="body" color="#64748B">
            Invite lifecycle management. No tenant data access.
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <ThemedText variant="label" color="#475569">Email</ThemedText>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(v) => { setEmail(v); setAuthError(null); }}
                placeholder="super-admin@platform.example"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                accessibilityLabel="input-sa-email"
                testID="input-sa-email"
              />
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText variant="label" color="#475569">Password</ThemedText>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(v) => { setPassword(v); setAuthError(null); }}
                placeholder="Your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                accessibilityLabel="input-sa-password"
                testID="input-sa-password"
              />
            </View>
          </View>

          {authError ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={14} color="#B53030" />
              <ThemedText variant="caption" color="#B53030" style={styles.errorText}>{authError}</ThemedText>
            </View>
          ) : null}

          <Button
            label={authLoading ? 'Signing in…' : 'Sign in as super-admin'}
            onPress={() => void handleSignIn()}
            loading={authLoading}
            accessibilityLabel="action-sa-login"
            testID="action-sa-login"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.topRow}>
        <ThemedText variant="heading">Invite codes</ThemedText>
        <Pressable
          onPress={handleSignOut}
          accessibilityLabel="action-sa-signout"
          testID="action-sa-signout"
          style={({ pressed }) => [styles.secondaryAction, { opacity: pressed ? 0.6 : 1 }]}
        >
          <ThemedText variant="caption" color="#1B3A5C">Sign out</ThemedText>
        </Pressable>
      </View>

      <View style={styles.createCard}>
        <ThemedText variant="label" color="#475569">Create a new invite</ThemedText>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Optional note (e.g. client name)"
            placeholderTextColor="#94A3B8"
            accessibilityLabel="input-invite-note"
            testID="input-invite-note"
          />
        </View>
        <Button
          label={createLoading ? 'Creating…' : 'Generate invite code'}
          onPress={() => void handleCreateInvite()}
          loading={createLoading}
          accessibilityLabel="action-create-invite"
          testID="action-create-invite"
        />
        {lastCode ? (
          <View style={styles.codeBanner}>
            <ThemedText variant="caption" color="#0F1F30">Latest code</ThemedText>
            <ThemedText variant="heading" style={styles.codeText}>{lastCode}</ThemedText>
          </View>
        ) : null}
        {actionError ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color="#B53030" />
            <ThemedText variant="caption" color="#B53030" style={styles.errorText}>{actionError}</ThemedText>
          </View>
        ) : null}
      </View>

      {listLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#1B3A5C" />
        </View>
      ) : listError ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={14} color="#B53030" />
          <ThemedText variant="caption" color="#B53030" style={styles.errorText}>{listError}</ThemedText>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={invites}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText variant="caption" color="#94A3B8" style={styles.empty}>
              No invite codes yet. Generate one above.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowHeader}>
                <ThemedText variant="label" style={styles.code}>{item.code}</ThemedText>
                <View style={[styles.badge, styles[`badge_${item.status}` as InviteBadgeStyleKey]]}>
                  <ThemedText variant="caption" color="#FFFFFF">{item.status}</ThemedText>
                </View>
              </View>
              {item.note ? (
                <ThemedText variant="caption" color="#475569">{item.note}</ThemedText>
              ) : null}
              <ThemedText variant="caption" color="#64748B">
                Expires: {formatTimestamp(item.expires_at)}
              </ThemedText>
              {item.used_at ? (
                <ThemedText variant="caption" color="#64748B">
                  Used: {formatTimestamp(item.used_at)} by {item.used_by_org_name ?? '—'}
                </ThemedText>
              ) : null}
              {item.status === 'active' ? (
                <Pressable
                  onPress={() => void handleResend(item.id)}
                  style={({ pressed }) => [styles.resendBtn, { opacity: pressed ? 0.6 : 1 }]}
                  accessibilityLabel={`action-resend-${item.id}`}
                  testID={`action-resend-${item.id}`}
                >
                  <Feather name="refresh-cw" size={13} color="#1B3A5C" />
                  <ThemedText variant="caption" color="#1B3A5C">Resend same code</ThemedText>
                </Pressable>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F7FB', paddingHorizontal: 20 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  header: { marginBottom: 24, gap: 6 },
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
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  secondaryAction: { paddingHorizontal: 10, paddingVertical: 6 },
  createCard: {
    gap: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginBottom: 16,
  },
  codeBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  codeText: { fontSize: 22, letterSpacing: 2 },
  listContent: { paddingBottom: 40 },
  row: { gap: 6, paddingVertical: 12 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { fontSize: 16, letterSpacing: 1.5 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badge_active: { backgroundColor: '#1B3A5C' },
  badge_used: { backgroundColor: '#94A3B8' },
  badge_expired: { backgroundColor: '#B53030' },
  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, alignSelf: 'flex-start' },
  separator: { height: 1, backgroundColor: '#E2E8F0' },
  empty: { textAlign: 'center', paddingTop: 32 },
  center: { alignItems: 'center', paddingVertical: 40 },
});
