import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import type { MobileTenantViewModel } from '../constants/mobile-view-models';
import { TENANTS } from '../constants/tenants';
import { useAuth } from './AuthContext';

const STORAGE_KEY = '@lonestar-tenant:selectedOrgSlug';

/**
 * Build a MobileTenantViewModel for the org-first pre-auth flow.
 * Before login, the app only needs local branding plus the selected org slug.
 * After login, authenticated org truth comes from AuthContext bootstrap data.
 */
function buildTenantViewModel(slug: string, organizationId?: string | null, organizationName?: string | null): MobileTenantViewModel | null {
  const branding = slug in TENANTS ? TENANTS[slug as keyof typeof TENANTS] : undefined;
  if (!branding) return null;
  return {
    id: branding.id,
    organizationId: organizationId ?? null,
    slug: branding.id,
    name: organizationName ?? branding.name,
    tagline: branding.tagline,
    theme: branding.theme,
    radius: branding.radius,
    logoInitials: branding.logoInitials,
  };
}

interface TenantContextValue {
  /** Selected organization — null until the user picks an org. */
  tenant: MobileTenantViewModel | null;
  isLoading: boolean;
  /** Persist the selected org by slug (e.g. 'lonestar', 'skyline'). */
  selectTenant: (slug: string) => Promise<void>;
  clearTenant: () => Promise<void>;
}

const TenantContext = React.createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { bootstrap } = useAuth();
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const tenant = React.useMemo(() => {
    const slug = bootstrap?.organization.slug ?? selectedSlug;
    if (!slug) {
      return null;
    }

    return buildTenantViewModel(
      slug,
      bootstrap?.organization.id ?? null,
      bootstrap?.organization.displayName ?? null,
    );
  }, [bootstrap, selectedSlug]);

  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((slug) => {
        if (slug) {
          setSelectedSlug(slug);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const selectTenant = React.useCallback(async (slug: string) => {
    await AsyncStorage.setItem(STORAGE_KEY, slug);
    setSelectedSlug(slug);
  }, []);

  const clearTenant = React.useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSelectedSlug(null);
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, isLoading, selectTenant, clearTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = React.useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
