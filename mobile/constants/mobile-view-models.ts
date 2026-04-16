import type { TenantRole, TenantBootstrapState } from '../../shared/tenant-types';
import type { TenantTheme } from './tenants';

/**
 * Mobile view model for the selected organization/tenant.
 * Screens read this via useTenant().tenant.
 * Structured to support a future swap from mock resolution to real
 * TenantBootstrapResponse without reworking any screen.
 */
export interface MobileTenantViewModel {
  id: string;
  organizationId: string | null;
  slug: string;
  name: string;
  tagline: string;
  theme: TenantTheme;
  radius: number;
  logoInitials: string;
}

/**
 * Mobile view model for the authenticated user.
 * Screens read this via useAuth().user.
 * Derived from TenantBootstrapState.profile via toMobileUserViewModel.
 */
export interface MobileUserViewModel {
  id: string;
  name: string;
  role: TenantRole;
  email: string;
}

/**
 * Adapter: derive MobileUserViewModel from a resolved TenantBootstrapState
 * and the email resolved during login-context resolution.
 *
 * Next step: call resolveMockLoginContext / real resolve-login-context to get
 * resolvedEmail, then pass it here alongside the bootstrap state.
 */
export function toMobileUserViewModel(
  bootstrap: TenantBootstrapState,
  resolvedEmail: string,
): MobileUserViewModel {
  return {
    id: bootstrap.profile.id,
    name: bootstrap.profile.displayName,
    role: bootstrap.profile.role,
    email: resolvedEmail,
  };
}
