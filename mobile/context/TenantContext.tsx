import React from 'react';
import { useAuth } from './AuthContext';
import type { TenantConfig } from '../constants/tenants';

interface TenantContextValue {
  tenant: TenantConfig | null;
  isLoading: boolean;
  clearTenant: () => Promise<void>;
}

const TenantContext = React.createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { orgBranding, isLoading, signOut } = useAuth();

  const tenant: TenantConfig | null = orgBranding
    ? {
        id: 'dynamic' as any,
        name: orgBranding.name,
        tagline: orgBranding.tagline,
        logoInitials: orgBranding.logoInitials,
        theme: orgBranding.theme,
        fontFamily: 'Inter_600SemiBold',
        radius: orgBranding.radius,
      }
    : null;

  async function clearTenant() {
    await signOut();
  }

  return (
    <TenantContext.Provider value={{ tenant, isLoading, clearTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = React.useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
