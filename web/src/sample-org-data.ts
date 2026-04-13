import type {
  BrandTheme,
  Organization,
  ResolveLoginContextResponse,
  TenantBootstrapState,
  TenantSessionClaims,
  TenantUserProfile,
} from '../../shared';

export const organizations: Organization[] = [
  {
    id: 'org-lonestar',
    slug: 'lonestar',
    legalName: 'LoneStar ERP Pvt Ltd',
    displayName: 'LoneStar AdTruck',
    status: 'active',
    supportEmail: 'support@lonestar.example',
  },
  {
    id: 'org-skyline',
    slug: 'skyline',
    legalName: 'Skyline Media Operations',
    displayName: 'Skyline Campaign Ops',
    status: 'active',
    supportEmail: 'hello@skyline.example',
  },
];

export const brandingBySlug: Record<string, BrandTheme> = {
  lonestar: {
    name: 'LoneStar AdTruck',
    logoUrl: '/brand/lonestar-logo.svg',
    colors: {
      primary: '#1d4ed8',
      secondary: '#eff6ff',
      accent: '#f97316',
      surface: '#ffffff',
      text: '#0f172a',
      mutedText: '#475569',
      border: '#cbd5e1',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      headingFallback: 'sans-serif',
      bodyFallback: 'sans-serif',
    },
  },
  skyline: {
    name: 'Skyline Campaign Ops',
    logoUrl: '/brand/skyline-logo.svg',
    colors: {
      primary: '#0f766e',
      secondary: '#ecfeff',
      accent: '#eab308',
      surface: '#ffffff',
      text: '#111827',
      mutedText: '#4b5563',
      border: '#d1d5db',
    },
    fonts: {
      heading: 'Avenir Next',
      body: 'Source Sans Pro',
      headingFallback: 'sans-serif',
      bodyFallback: 'sans-serif',
    },
  },
};

export const sampleSessions: Record<string, { profile: TenantUserProfile; claims: TenantSessionClaims }> = {
  'lonestar:admin': {
    profile: {
      id: 'user-admin-1',
      organizationId: 'org-lonestar',
      organizationSlug: 'lonestar',
      role: 'admin',
      username: 'opsadmin',
      displayName: 'LoneStar Admin',
      email: 'opsadmin@lonestar.example',
      isActive: true,
    },
    claims: {
      sub: 'user-admin-1',
      organization_id: 'org-lonestar',
      org_slug: 'lonestar',
      org_role: 'admin',
    },
  },
  'lonestar:driver': {
    profile: {
      id: 'user-driver-1',
      organizationId: 'org-lonestar',
      organizationSlug: 'lonestar',
      role: 'driver',
      username: 'driver1',
      displayName: 'LoneStar Driver',
      email: 'driver1@lonestar.example',
      isActive: true,
    },
    claims: {
      sub: 'user-driver-1',
      organization_id: 'org-lonestar',
      org_slug: 'lonestar',
      org_role: 'driver',
    },
  },
  'skyline:client': {
    profile: {
      id: 'user-client-1',
      organizationId: 'org-skyline',
      organizationSlug: 'skyline',
      role: 'client',
      username: 'client1',
      displayName: 'Skyline Client',
      email: 'client1@skyline.example',
      clientId: 'client-skyline-1',
      isActive: true,
    },
    claims: {
      sub: 'user-client-1',
      organization_id: 'org-skyline',
      org_slug: 'skyline',
      org_role: 'client',
    },
  },
};

export const sampleBootstraps: Record<string, TenantBootstrapState> = Object.fromEntries(
  Object.entries(sampleSessions).map(([key, value]) => [
    key,
    {
      organization: {
        id: value.claims.organization_id,
        slug: value.claims.org_slug,
        displayName: brandingBySlug[value.claims.org_slug].name,
        status: 'active',
        supportEmail: organizations.find(org => org.slug === value.claims.org_slug)?.supportEmail ?? null,
      },
      profile: value.profile,
      claims: value.claims,
      navigation: {
        shell: value.claims.org_role,
        initialRoute: `/${value.claims.org_role}`,
      },
    },
  ]),
);

export function resolveLogin(orgSlug: string, loginIdentifier: string): ResolveLoginContextResponse | null {
  const org = organizations.find(item => item.slug === orgSlug);
  if (!org)
    return null;

  const candidates = Object.values(sampleSessions).filter(session =>
    session.profile.organizationSlug === orgSlug
    && (session.profile.username === loginIdentifier || session.profile.email === loginIdentifier),
  );

  const match = candidates[0];
  if (!match)
    return null;

  return {
    organization: {
      id: org.id,
      slug: org.slug,
      displayName: org.displayName,
      status: org.status,
    },
    resolvedEmail: match.profile.email ?? `${match.profile.username}@${org.slug}.tenant.local`,
    resolvedRole: match.profile.role,
    loginIdentifierType: match.profile.email === loginIdentifier ? 'email' : 'username',
    brandingDisplayName: brandingBySlug[org.slug].name,
  };
}
