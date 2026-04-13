import * as React from 'react';
import { organizations, resolveLogin } from './sample-org-data';
import { useBrandTheme } from './branding';
import { useTenantSession } from './tenant-session';

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        border: '1px solid #e2e8f0',
      }}
    >
      {children}
    </div>
  );
}

function OrgSelector() {
  const { selectOrg } = useTenantSession();
  const { setThemeByOrgSlug } = useBrandTheme();

  return (
    <Card>
      <h1>Choose organization</h1>
      <p>This spike proves org-first login before role routing.</p>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {organizations.map(org => (
          <button
            key={org.id}
            onClick={() => {
              selectOrg(org.slug);
              setThemeByOrgSlug(org.slug);
            }}
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              background: '#fff',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <strong>{org.displayName}</strong>
            <div style={{ fontSize: 14, color: '#475569' }}>{org.slug}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function LoginScreen() {
  const [identifier, setIdentifier] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const { selectedOrgSlug, loginContext, setLoginContext, signInAsRoleDemo } = useTenantSession();
  const { theme } = useBrandTheme();

  if (!selectedOrgSlug)
    return null;

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: theme.colors.primary }} />
        <div>
          <div style={{ fontWeight: 700 }}>{theme.name}</div>
          <div style={{ fontSize: 14, color: theme.colors.mutedText }}>Org-aware login</div>
        </div>
      </div>

      <label style={{ display: 'block', marginBottom: 8 }}>Username or email</label>
      <input
        value={identifier}
        onChange={event => setIdentifier(event.target.value)}
        placeholder="driver1 or client1@skyline.example"
        style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #cbd5e1' }}
      />

      <button
        onClick={() => {
          const result = resolveLogin(selectedOrgSlug, identifier);
          if (!result) {
            setError('No matching user found inside the selected organization.');
            return;
          }
          setError(null);
          setLoginContext(result);
        }}
        style={{
          marginTop: 16,
          padding: '12px 16px',
          borderRadius: 12,
          border: 'none',
          background: theme.colors.primary,
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        Resolve login
      </button>

      {error && <p style={{ color: '#b91c1c', marginTop: 12 }}>{error}</p>}

      {loginContext && (
        <div style={{ marginTop: 12, color: theme.colors.mutedText, fontSize: 14 }}>
          Resolved as {loginContext.resolvedRole} using {loginContext.loginIdentifierType}. Password auth would continue with {loginContext.resolvedEmail}.
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <p style={{ marginBottom: 8 }}>Demo role handoff after login resolution:</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => signInAsRoleDemo('admin')}>Admin</button>
          <button onClick={() => signInAsRoleDemo('driver')}>Driver</button>
          <button onClick={() => signInAsRoleDemo('client')}>Client</button>
        </div>
      </div>
    </Card>
  );
}

function RoleHome() {
  const { bootstrap, signOut } = useTenantSession();
  const { theme } = useBrandTheme();

  if (!bootstrap)
    return null;

  const { profile, claims, navigation, organization } = bootstrap;

  return (
    <Card>
      <h2>{profile.role} home</h2>
      <p>This placeholder proves tenant bootstrap state and role routing.</p>
      <ul>
        <li>Organization: {organization.slug}</li>
        <li>Organization ID: {organization.id}</li>
        <li>User: {profile.displayName}</li>
        <li>Role: {claims.org_role}</li>
        <li>Initial route: {navigation.initialRoute}</li>
      </ul>
      <button
        onClick={signOut}
        style={{
          marginTop: 16,
          padding: '12px 16px',
          borderRadius: 12,
          border: 'none',
          background: theme.colors.accent,
          color: '#111827',
          cursor: 'pointer',
        }}
      >
        Sign out
      </button>
    </Card>
  );
}

export function OrgRouter() {
  const { selectedOrgSlug, bootstrap } = useTenantSession();

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 32 }}>
      {!selectedOrgSlug && <OrgSelector />}
      {selectedOrgSlug && !bootstrap && <LoginScreen />}
      {selectedOrgSlug && bootstrap && <RoleHome />}
    </main>
  );
}
