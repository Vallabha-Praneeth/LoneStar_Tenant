import * as React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useBrandTheme } from './branding';
import { organizations, resolveLogin } from './sample-org-data';
import { useTenantSession } from './tenant-session';

function ScreenCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 12,
      }}
    >
      {children}
    </View>
  );
}

function OrgSelectionScreen() {
  const { selectOrg } = useTenantSession();
  const { setThemeByOrgSlug } = useBrandTheme();

  return (
    <ScreenCard>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Choose organization</Text>
      {organizations.map(org => (
        <TouchableOpacity
          key={org.id}
          onPress={() => {
            selectOrg(org.slug);
            setThemeByOrgSlug(org.slug);
          }}
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#cbd5e1',
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600' }}>{org.displayName}</Text>
          <Text style={{ color: '#64748b' }}>{org.slug}</Text>
        </TouchableOpacity>
      ))}
    </ScreenCard>
  );
}

function LoginScreen() {
  const { selectedOrgSlug, loginContext, setLoginContext, signInAsRoleDemo } = useTenantSession();
  const { theme } = useBrandTheme();

  if (!selectedOrgSlug)
    return null;

  const result = resolveLogin(selectedOrgSlug, selectedOrgSlug === 'skyline' ? 'client1@skyline.example' : 'driver1');

  return (
    <ScreenCard>
      <Text style={{ fontSize: 22, fontWeight: '700', color: theme.colors.text }}>{theme.name}</Text>
      <Text style={{ color: theme.colors.mutedText }}>
        Mobile spike keeps the binary shared and switches brand after org selection.
      </Text>

      <TouchableOpacity
        onPress={() => setLoginContext(result)}
        style={{ backgroundColor: theme.colors.primary, borderRadius: 14, padding: 14 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Resolve sample login</Text>
      </TouchableOpacity>

      {loginContext && (
        <Text style={{ color: theme.colors.mutedText }}>
          Resolved as {loginContext.resolvedRole} using {loginContext.loginIdentifierType}.
        </Text>
      )}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity onPress={() => signInAsRoleDemo('admin')} style={{ padding: 12, borderRadius: 12, backgroundColor: '#e2e8f0' }}>
          <Text>Admin</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => signInAsRoleDemo('driver')} style={{ padding: 12, borderRadius: 12, backgroundColor: '#e2e8f0' }}>
          <Text>Driver</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => signInAsRoleDemo('client')} style={{ padding: 12, borderRadius: 12, backgroundColor: '#e2e8f0' }}>
          <Text>Client</Text>
        </TouchableOpacity>
      </View>
    </ScreenCard>
  );
}

function RoleHomeScreen() {
  const { bootstrap, signOut } = useTenantSession();
  const { theme } = useBrandTheme();

  if (!bootstrap)
    return null;

  const { profile, navigation, organization } = bootstrap;

  return (
    <ScreenCard>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>{profile.role} home</Text>
      <Text>Organization: {organization.slug}</Text>
      <Text>User: {profile.displayName}</Text>
      <Text>Tenant ID: {organization.id}</Text>
      <Text>Initial route: {navigation.initialRoute}</Text>

      <TouchableOpacity
        onPress={signOut}
        style={{ backgroundColor: theme.colors.accent, borderRadius: 14, padding: 14 }}
      >
        <Text style={{ fontWeight: '700' }}>Sign out</Text>
      </TouchableOpacity>
    </ScreenCard>
  );
}

export function OrgRouter() {
  const { selectedOrgSlug, bootstrap } = useTenantSession();
  const { theme } = useBrandTheme();

  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        backgroundColor: theme.colors.secondary,
        justifyContent: 'center',
      }}
    >
      {!selectedOrgSlug && <OrgSelectionScreen />}
      {selectedOrgSlug && !bootstrap && <LoginScreen />}
      {selectedOrgSlug && bootstrap && <RoleHomeScreen />}
    </View>
  );
}
