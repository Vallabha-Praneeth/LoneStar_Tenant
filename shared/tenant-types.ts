import type { BrandTheme } from './branding-types';

export type TenantRole = 'admin' | 'driver' | 'client';

export type PlatformRole = 'support' | 'ops' | 'super_admin';

export type LoginIdentifierType = 'username' | 'email';

export interface Organization {
  id: string;
  slug: string;
  legalName: string;
  displayName: string;
  status: 'active' | 'suspended' | 'draft';
  supportEmail?: string | null;
}

export interface TenantUserProfile {
  id: string;
  organizationId: string;
  organizationSlug: string;
  role: TenantRole;
  username: string;
  displayName: string;
  email?: string | null;
  clientId?: string | null;
  isActive: boolean;
}

export interface TenantSessionClaims {
  sub: string;
  organization_id: string;
  org_slug: string;
  org_role: TenantRole;
  platform_role?: PlatformRole | null;
  support_grant_id?: string | null;
}

export interface ResolveLoginContextRequest {
  orgSlug: string;
  loginIdentifier: string;
}

export interface ResolveLoginContextResponse {
  organization: Pick<Organization, 'id' | 'slug' | 'displayName' | 'status'>;
  resolvedEmail: string;
  resolvedRole: TenantRole;
  loginIdentifierType: LoginIdentifierType;
  brandingDisplayName?: string | null;
}

export interface TenantBootstrapOrganization {
  id: string;
  slug: string;
  displayName: string;
  status: Organization['status'];
  supportEmail?: string | null;
}

export interface TenantBootstrapNavigation {
  shell: TenantRole;
  initialRoute: string;
}

export interface TenantBootstrapState {
  organization: TenantBootstrapOrganization;
  profile: TenantUserProfile;
  claims: TenantSessionClaims;
  navigation: TenantBootstrapNavigation;
}

export interface TenantBootstrapRequest {
  expectedOrgSlug?: string;
}

export interface TenantBootstrapResponse {
  session: TenantBootstrapState;
  branding: BrandTheme;
}

export interface TenantScopedRequest {
  organizationId: string;
}

export interface CreateTenantUserRequest extends TenantScopedRequest {
  role: TenantRole;
  username: string;
  displayName: string;
  password: string;
  email: string;
  clientId?: string;
}

export interface SupportAccessGrant {
  id: string;
  organizationId: string;
  requestedBy: string;
  approvedBy?: string | null;
  reason: string;
  status: 'requested' | 'approved' | 'expired' | 'revoked';
  startsAt: string;
  expiresAt: string;
}

export interface SupportAuditEvent {
  id: string;
  grantId: string;
  organizationId: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}
